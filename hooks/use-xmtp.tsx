"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { Client } from "@xmtp/browser-sdk"
import { ethers } from "ethers"
import { ReactionCodec } from "@/lib/xmtp/reaction-codec"

import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"

interface XMTPContextType {
  client: Client<any> | null
  isConnected: boolean
  isConnecting: boolean
  isRegistered: boolean
  address: string | null
  ensName: string | null
  connectWallet: () => Promise<void>
  disconnect: () => void
  switchAccount: () => Promise<void>
  registerDevice: () => Promise<void>
  error: string | null
  clearError: () => void
}

const XMTPContext = createContext<XMTPContextType | undefined>(undefined)

export function XMTPProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client<any> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)
  const upsertUser = useMutation(api.users.upsertUser)

  const connectWallet = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      // Check if any Ethereum provider is available
      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected. Please install MetaMask or another compatible wallet.")
      }

      // Check if MetaMask is specifically available
      const isMetaMask = window.ethereum.isMetaMask
      if (!isMetaMask && !window.ethereum.providers?.some((p: any) => p.isMetaMask)) {
        console.warn("MetaMask not detected, trying with available provider")
      }

      // Request account access with better error handling
      const provider = new ethers.BrowserProvider(window.ethereum)

      try {
        await provider.send("eth_requestAccounts", [])
      } catch (requestError: any) {
        if (requestError.code === 4001) {
          throw new Error("Connection request was rejected. Please approve the connection to continue.")
        } else if (requestError.code === -32002) {
          throw new Error("A connection request is already pending. Please check your wallet.")
        } else {
          throw new Error("Failed to request wallet connection. Please try again.")
        }
      }

      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // Try to resolve ENS name
      let resolvedEnsName = null
      try {
        resolvedEnsName = await provider.lookupAddress(userAddress)
      } catch (err) {
        // ENS resolution failed, continue without it

        console.log("ENS resolution failed:", err)
      }

      // V3: load/create local DB encryption key (required)
      function loadOrCreateDbKey(): Uint8Array {
        const keyHex = localStorage.getItem("xmtp_db_key")
        if (keyHex) return Uint8Array.from(keyHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
        const key = new Uint8Array(32)
        crypto.getRandomValues(key)
        localStorage.setItem(
          "xmtp_db_key",
          Array.from(key)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        )
        return key
      }
      const dbEncryptionKey = loadOrCreateDbKey()

      // Bridge ethers signer to XMTP V3 signer
      function hexToBytes(hex: string): Uint8Array {
        const clean = hex.startsWith("0x") ? hex.slice(2) : hex
        const bytes = new Uint8Array(clean.length / 2)
        for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
        return bytes
      }

      const signerV3 = {
        type: "EOA" as const,
        getIdentifier: async () => ({ identifier: await signer.getAddress(), identifierKind: "Ethereum" as const }),
        signMessage: async (message: string) => {
          const sigHex = await signer.signMessage(message)
          return hexToBytes(sigHex)
        },
      }

      // Initialize XMTP client (V3) with better error handling
      let xmtpClient
      try {
        console.debug("XMTP: Client.create options (V3)", {
          env: "production",
          appVersion: "phenix-chat/0.1.0",
          dbEncryptionKey: true,
        })
        // Using persistent storage; auto-register enabled in dev
        xmtpClient = await Client.create(signerV3, {
          env: "production",
          dbEncryptionKey,
          appVersion: "phenix-chat/0.1.0",
          loggingLevel: "warn",
          // Use persistent storage (IndexedDB/OPFS) so the device key survives refresh
          // NOTE: leave dbPath undefined for persistence; do not set to null
          // Enable device sync so other installations of the same inbox receive group updates/messages
          disableDeviceSync: false,
          // Always auto-register in dev to keep flow simple
          disableAutoRegister: false,
          codecs: [new ReactionCodec()],
        })
        console.debug("XMTP: Client created (V3)")
        try {
          const registered = await xmtpClient.isRegistered()
          setIsRegistered(registered)
        } catch {}

      } catch (xmtpError: any) {
        const raw = xmtpError?.message || String(xmtpError)
        if (raw.toLowerCase().includes("network")) {
          throw new Error("XMTP network error. Please check your internet connection and try again.")
        } else if (raw.toLowerCase().includes("rate limit") || raw.toLowerCase().includes("429")) {
          throw new Error("Too many connection attempts. Please wait a moment and try again.")
        } else if (raw.toLowerCase().includes("sign") || raw.toLowerCase().includes("wallet")) {
          throw new Error("Wallet signature was rejected or unavailable. Please approve the XMTP request in your wallet.")
        } else {
          throw new Error(`Failed to initialize XMTP client: ${raw}`)
        }
      }

      setClient(xmtpClient)
      setAddress(userAddress)
      setEnsName(resolvedEnsName)
      setIsConnected(true)

      // Upsert user in Convex (save inboxId too for profile lookups)
      try { await upsertUser({ address: userAddress, ensName: resolvedEnsName ?? undefined, inboxId: xmtpClient.inboxId }) } catch {}

      // Store connection state
      localStorage.setItem("xmtp_connected", "true")
      localStorage.setItem("xmtp_address", userAddress)
    } catch (err) {
      console.error("Failed to connect wallet:", err)
      let errorMessage = "Failed to connect wallet"

      if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  const registerDevice = async () => {
    if (!client) throw new Error("Not connected")
    await client.register()
    setIsRegistered(true)
  }

  const switchAccount = async () => {
    try {
      setError(null)
      if (!window.ethereum) return

      // Request account switching
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })

      // Reconnect with new account
      await connectWallet()
    } catch (err) {
      console.error("Failed to switch account:", err)
      setError("Failed to switch account. Please try again.")
    }
  }

  const disconnect = () => {
    setClient(null)
    setAddress(null)
    setEnsName(null)
    setIsConnected(false)
    setError(null)

    // Clear stored connection state
    localStorage.removeItem("xmtp_connected")
    localStorage.removeItem("xmtp_address")
  }

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        disconnect()
      } else if (accounts[0] !== address) {
        // User switched accounts
        connectWallet()
      }
    }

    const handleChainChanged = () => {
      // Reload the page when chain changes
      window.location.reload()
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [address])

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const wasConnected = localStorage.getItem("xmtp_connected")
      const storedAddress = localStorage.getItem("xmtp_address")

      if (wasConnected && storedAddress && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()

          // Check if the stored address is still connected
          if (accounts.some((account) => account.address?.toLowerCase?.() === storedAddress.toLowerCase())) {
            await connectWallet()
          } else {
            // Clear stale connection data
            localStorage.removeItem("xmtp_connected")
            localStorage.removeItem("xmtp_address")
          }
        } catch (err) {
          console.log("No existing wallet connection")
          localStorage.removeItem("xmtp_connected")
          localStorage.removeItem("xmtp_address")
        }
      }
    }

    checkConnection()
  }, [])

  return (
    <XMTPContext.Provider
      value={{
        client,
        isConnected,
        isConnecting,
        address,
        ensName,
        isRegistered,
        connectWallet,
        disconnect,
        switchAccount,
        registerDevice,
        error,
        clearError,
      }}
    >
      {children}
    </XMTPContext.Provider>
  )
}

export function useXMTP() {
  const context = useContext(XMTPContext)
  if (context === undefined) {
    throw new Error("useXMTP must be used within an XMTPProvider")
  }
  return context
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
