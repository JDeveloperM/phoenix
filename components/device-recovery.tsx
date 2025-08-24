"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Utils } from "@xmtp/browser-sdk"
import { ethers } from "ethers"

export function DeviceRecovery() {
  const [ethAddress, setEthAddress] = useState<string>("")
  const [inboxId, setInboxId] = useState<string>("")
  const [installations, setInstallations] = useState<Array<{ id: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"idle" | "fetched" | "revoking" | "done">("idle")

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

  const connectWalletForRecovery = async () => {
    try {
      setError(null)
      // Minimal wallet connect without creating XMTP client
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const addr = await signer.getAddress()
      setEthAddress(addr)
      return signer
    } catch (e: any) {
      setError(e?.message || "Wallet connection failed")
      throw e
    }
  }

  const handleFetch = async () => {
    try {
      setError(null)
      setLoading(true)
      const signer = await connectWalletForRecovery()
      const addr = await signer.getAddress()
      const utils = new Utils()
      const id = await utils.getInboxIdForIdentifier({ identifier: addr, identifierKind: "Ethereum" }, "production")
      if (!id) throw new Error("No XMTP inbox found for this address")

      setInboxId(id)
      const states = await utils.inboxStateFromInboxIds([id], "production")
      const me = states?.[0]
      setInstallations((me?.installations || []).map((i) => ({ id: i.id })))
      setStep("fetched")
    } catch (e: any) {
      setError(e?.message || "Failed to fetch devices")
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAll = async () => {
    try {
      setLoading(true)
      setError(null)
      setStep("revoking")

      // Ensure signer
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const addr = await signer.getAddress()

      // Bridge ethers signer to XMTP Signer shape
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

      // Convert installation IDs to bytes; try hex first, then base64
      const ids: Uint8Array[] = me.installations.map((i) => {
        const s = i.id
        try { return hexToBytes(s) } catch { return b64ToBytes(s) }
      })

      await utils.revokeInstallations(xmtpSigner as any, inboxId, ids, "production")
      setStep("done")
    } catch (e: any) {
      setError(e?.message || "Failed to revoke devices")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">XMTP Device Recovery</CardTitle>
        <CardDescription className="text-gray-400">Free up installation slots if you hit the 10/10 cap.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-600 bg-red-600/10">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
        <div className="text-sm text-gray-300">
          Wallet address: <Badge variant="outline">{ethAddress || "not connected"}</Badge>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleFetch} disabled={loading}>
            {loading ? "Loading..." : "Fetch devices"}
          </Button>
          <Button variant="secondary" onClick={handleRevokeAll} disabled={loading || !inboxId}>
            {step === "revoking" ? "Revoking..." : "Revoke all devices"}
          </Button>
        </div>
        {step !== "idle" && (
          <div className="text-xs text-gray-400">
            Inbox: <code className="text-gray-300">{inboxId || "-"}</code>
          </div>
        )}
        {installations.length > 0 && (
          <div className="text-xs text-gray-400">
            Found {installations.length} installation(s)
          </div>
        )}
      </CardContent>
    </Card>
  )
}

