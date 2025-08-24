"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useXMTP } from "@/hooks/use-xmtp"
import { Utils } from "@xmtp/browser-sdk"

export function ManageDevices() {
  const { client } = useXMTP()
  const [installations, setInstallations] = useState<Array<{ id: string; lastSeen?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!client?.inboxId) return
      setLoading(true)
      setError(null)
      try {
        // Query inbox state to list installations
        const utils = new Utils()
        const state = await utils.inboxStateFromInboxIds([client.inboxId], "production")
        const me = state?.[0]
        const items = (me?.installations || []).map((inst) => ({
          id: inst.id,
          lastSeen: inst.clientTimestampNs ? new Date(Number(inst.clientTimestampNs / BigInt(1_000_000))).toLocaleString() : undefined,
        }))
        setInstallations(items)
      } catch (err: any) {
        setError(err?.message || "Failed to load devices")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [client?.inboxId])

  const revokeAllOthers = async () => {
    if (!client) return
    setRevoking(true)
    setError(null)
    try {
      await client.revokeAllOtherInstallations()
      // refresh list
      const utils = new Utils()
      const state = await utils.inboxStateFromInboxIds([client.inboxId!], "production")
      const me = state?.[0]
      const items = (me?.installations || []).map((inst) => ({
        id: inst.id,
        lastSeen: inst.clientTimestampNs ? new Date(Number(inst.clientTimestampNs / BigInt(1_000_000))).toLocaleString() : undefined,
      }))
      setInstallations(items)
    } catch (err: any) {
      setError(err?.message || "Failed to revoke")
    } finally {
      setRevoking(false)
    }
  }

  if (!client) return <div className="text-gray-400">Connect your wallet first.</div>

  return (
    <div className="space-y-3">
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-300">Inbox: <Badge variant="outline">{client.inboxId}</Badge></div>
        <Button size="sm" variant="secondary" onClick={revokeAllOthers} disabled={revoking}>
          {revoking ? "Revoking..." : "Revoke all other devices"}
        </Button>
      </div>

      <Card className="bg-gray-900 border border-gray-700">
        <ScrollArea className="max-h-64">
          <div className="p-3 space-y-2">
            {loading ? (
              <div className="text-gray-400 text-sm">Loading devices...</div>
            ) : installations.length === 0 ? (
              <div className="text-gray-400 text-sm">No installations found.</div>
            ) : (
              installations.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between text-sm">
                  <code className="text-gray-300">{inst.id}</code>
                  <div className="text-gray-500">{inst.lastSeen || ""}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}

