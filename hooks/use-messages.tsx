"use client"

import { useState, useEffect } from "react"
import type { Dm, Group, DecodedMessage } from "@xmtp/browser-sdk"
import { useXMTP } from "./use-xmtp"

export function useMessages(conversation: Dm | Group | null) {
  const { client } = useXMTP()
  const [messages, setMessages] = useState<DecodedMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const dedupeById = (msgs: DecodedMessage[]) => {
    const seen = new Set<string>()
    const out: DecodedMessage[] = []
    for (const m of msgs) {
      if (!seen.has(m.id)) {
        seen.add(m.id)
        out.push(m)
      }
    }
    return out
  }

  useEffect(() => {
    if (!conversation) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const msgs = await conversation.messages()
        setMessages(dedupeById(msgs))
      } catch (err) {
        console.error("Failed to load messages:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()

    // Set up message streaming (V3)
    const streamMessages = async () => {
      try {
        const stream = await conversation.stream()
        for await (const message of stream) {
          setMessages((prev) => dedupeById([...prev, message]))
        }
      } catch (err) {
        console.error("Error streaming messages:", err)
      }
    }
    streamMessages()
  }, [conversation])
  const [canMessagePeer, setCanMessagePeer] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        if (!conversation || !client) return
        const peer = await conversation.peerInboxId()
        let ok: boolean | null = null
        try {
          // Try Map<string, boolean> result
          const res: any = await (client as any).canMessage([peer])
          if (res && typeof res.get === "function") {
            ok = res.get(peer) === true
          } else if (Array.isArray(res)) {
            ok = res[0] === true
          } else if (typeof res === "boolean") {
            ok = res
          } else {
            ok = null
          }
        } catch (e) {
          ok = null
        }
        if (!cancelled) setCanMessagePeer(ok)
      } catch {
        if (!cancelled) setCanMessagePeer(null)
      }
    }
    check()
    return () => { cancelled = true }
  }, [conversation, client])


  const sendMessage = async (content: string) => {
    if (!conversation) throw new Error("No conversation selected")

    try {
      // Ensure the client and this installation are registered before sending
      if (!client) throw new Error("XMTP client not initialized")
      const registered = await client.isRegistered().catch(() => true)
      if (!registered) {
        throw new Error("This device is not registered to send messages. Click Register above the composer.")
      }

      await conversation.send(content)
    } catch (err) {
      console.error("Failed to send message:", err)
      throw err
    }
  }

  return {
    messages,
    isLoading,
    canMessagePeer,
    sendMessage,
  }
}
