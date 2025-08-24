"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useXMTP } from "@/hooks/use-xmtp"
import { useConversations } from "@/hooks/use-conversations"

export function InviteBootstrap() {
  const params = useSearchParams()
  const router = useRouter()
  const invite = params.get("invite") // expected to be peer inboxId
  const { isConnected, isRegistered, connectWallet, registerDevice, client } = useXMTP()
  const { conversations } = useConversations()

  useEffect(() => {
    const run = async () => {
      if (!invite) return
      try {
        // 1) Ensure wallet connected
        if (!isConnected) {
          await connectWallet()
        }
        // 2) Ensure device is registered
        if (!isRegistered) {
          await registerDevice()
        }
        // 3) Ensure DM exists/open
        if (client) {
          // Check if a DM with this peer exists already
          const exists = conversations.find((c) => c.peerInboxId === invite)
          if (!exists) {
            try { await client.conversations.newDm(invite) } catch {}
          }
          // Navigate into the chat layout; sidebar will pick it up
          // We keep the invite param to avoid breaking back button; could also clear it
          router.push("/")
        }
      } catch (e) {
        console.error("Invite bootstrap failed:", e)
      }
    }
    run()
  }, [invite, isConnected, isRegistered, client])

  return null
}

