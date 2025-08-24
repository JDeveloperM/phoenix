"use client"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Loader2, AlertCircle, RefreshCw, Trash2 } from "lucide-react"
import { useXMTP } from "@/hooks/use-xmtp"
import { useState, useEffect } from "react"
import { Utils } from "@xmtp/browser-sdk"
import { ethers } from "ethers"

export function WalletConnect() {
  const { connectWallet, switchAccount, isConnecting, error, clearError, setError } = useXMTP()

  const [hasWallet, setHasWallet] = useState(false)
  const [isMetaMask, setIsMetaMask] = useState(false)
  const [showDeviceManagement, setShowDeviceManagement] = useState(false)
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [installations, setInstallations] = useState<Array<{ id: string }>>([])
  const [inboxId, setInboxId] = useState<string>("")

  useEffect(() => {
    // Check for wallet availability
    const checkWallet = () => {
      const hasEthereum = !!window.ethereum
      const hasMetaMask = !!(window.ethereum?.isMetaMask || window.ethereum?.providers?.some((p: any) => p.isMetaMask))

      setHasWallet(hasEthereum)
      setIsMetaMask(hasMetaMask)
    }

    checkWallet()

    // Listen for wallet installation
    const handleEthereum = () => checkWallet()
    window.addEventListener("ethereum#initialized", handleEthereum, { once: true })

    // Timeout for wallet detection
    setTimeout(checkWallet, 1000)

    return () => {
      window.removeEventListener("ethereum#initialized", handleEthereum)
    }
  }, [])

  const handleConnectClick = () => {
    clearError()
    if (!hasWallet) {
      setError("No Ethereum wallet detected. Please install MetaMask or another compatible wallet.")
      return
    }
    connectWallet()
  }

  const handleSwitchAccount = () => {
    clearError()
    if (!hasWallet) {
      setError("No Ethereum wallet detected. Please install MetaMask first.")
      return
    }
    switchAccount()
  }

  // Device management functions
  function hexToBytes(hex: string): Uint8Array {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex
    const bytes = new Uint8Array(clean.length / 2)
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
    return bytes
  }

  function b64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  }

  const handleFetchDevices = async () => {
    try {
      setDeviceError(null)
      setDeviceLoading(true)
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const addr = await signer.getAddress()
      const utils = new Utils()
      const id = await utils.getInboxIdForIdentifier({ identifier: addr, identifierKind: "Ethereum" }, "production")
      if (!id) throw new Error("No XMTP inbox found for this address")

      setInboxId(id)
      const states = await utils.inboxStateFromInboxIds([id], "production")
      const me = states?.[0]
      setInstallations((me?.installations || []).map((i) => ({ id: i.id })))
    } catch (e: any) {
      setDeviceError(e?.message || "Failed to fetch devices")
    } finally {
      setDeviceLoading(false)
    }
  }

  const handleRevokeAllDevices = async () => {
    try {
      setDeviceLoading(true)
      setDeviceError(null)

      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const addr = await signer.getAddress()

      const xmtpSigner = {
        type: "EOA" as const,
        getIdentifier: async () => ({ identifier: addr, identifierKind: "Ethereum" as const }),
        signMessage: async (message: string) => {
          const sigHex = await signer.signMessage(message)
          return hexToBytes(sigHex)
        },
      }

      const utils = new Utils()
      const states = await utils.inboxStateFromInboxIds([inboxId], "production")
      const me = states?.[0]
      if (!me) throw new Error("Inbox state unavailable")

      const ids: Uint8Array[] = me.installations.map((i) => {
        const s = i.id
        try { return hexToBytes(s) } catch { return b64ToBytes(s) }
      })

      await utils.revokeInstallations(xmtpSigner as any, inboxId, ids, "production")
      setInstallations([])
      setDeviceError("All devices revoked successfully")
    } catch (e: any) {
      setDeviceError(e?.message || "Failed to revoke devices")
    } finally {
      setDeviceLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Main Connect Button */}
      <div className="text-center space-y-4">
        {error && (
          <Alert className="border-red-600 bg-red-600/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleConnectClick}
          disabled={isConnecting}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 text-lg font-mono tracking-wider cyber-glow-red"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              CONNECTING...
            </>
          ) : hasWallet ? (
            <>
              <Wallet className="w-5 h-5 mr-3" />
              CONNECT WALLET
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 mr-3" />
              INSTALL WALLET
            </>
          )}
        </Button>

        {hasWallet && (
          <div className="flex space-x-2 justify-center">
            <Button
              onClick={handleSwitchAccount}
              disabled={isConnecting}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent font-mono"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Switch Account
            </Button>
            <Button
              onClick={() => setShowDeviceManagement(!showDeviceManagement)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent font-mono"
            >
              Device Management
            </Button>
          </div>
        )}
      </div>

      {/* Device Management Section */}
      {showDeviceManagement && hasWallet && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3 backdrop-blur-sm">
          <h3 className="text-white font-mono text-sm">XMTP Device Management</h3>

          {deviceError && (
            <Alert className="border-red-600 bg-red-600/10">
              <AlertDescription className="text-red-400 text-xs">{deviceError}</AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleFetchDevices}
              disabled={deviceLoading}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent font-mono text-xs"
            >
              {deviceLoading ? "Loading..." : "Fetch Devices"}
            </Button>
            <Button
              onClick={handleRevokeAllDevices}
              disabled={deviceLoading || !inboxId}
              size="sm"
              variant="outline"
              className="border-red-600 text-red-300 hover:bg-red-700/20 bg-transparent font-mono text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {deviceLoading ? "Revoking..." : "Revoke All"}
            </Button>
          </div>

          {installations.length > 0 && (
            <div className="text-xs text-gray-400 font-mono">
              Found {installations.length} device(s)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
