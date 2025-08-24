"use client"

import { useState, useEffect } from "react"
import { Dm } from "@xmtp/browser-sdk"
import { useXMTP } from "./use-xmtp"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export interface ConversationData {
  conversation: Dm
  peerInboxId: string
  lastMessage?: string
  timestamp?: Date
}

export function useConversations() {
  const { client, isConnected } = useXMTP()
  const upsertConversation = useMutation(api.conversations.upsertConversation)
  const loadSavedConversations = useQuery(
    api.conversations.getConversationsForAddress,
    isConnected && client?.accountIdentifier ? { address: client.accountIdentifier.identifier } : "skip",
  )

  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const dedupeByPeer = (items: ConversationData[]) => {
    const seen = new Set<string>()
    const out: ConversationData[] = []
    for (const it of items) {
      const key = it.peerInboxId?.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        out.push(it)
      }
    }
    return out
  }

  useEffect(() => {
    if (!client || !isConnected) {
      setConversations([])
      return
    }

    const loadConversations = async () => {
      try {
        setIsLoading(true)
        console.debug("XMTP V3: listing DM conversations ...")
        const convos = await client.conversations.listDms()
        console.debug("XMTP V3: DMs listed", { count: convos.length })

        const conversationData: ConversationData[] = await Promise.all(
          convos.map(async (conversation) => {
            try {
              const messages = await conversation.messages()
              const lastMessage = messages[messages.length - 1]
              const peerInboxId = await conversation.peerInboxId()

              return {
                conversation,
                peerInboxId,
                lastMessage: typeof lastMessage?.content === "string" ? lastMessage.content : "[system update]",
                timestamp: lastMessage ? new Date(Number(lastMessage.sentAtNs / BigInt(1_000_000))) : new Date(),
              }
            } catch (err) {
              console.error("Error loading conversation messages:", err)
              const peerInboxId = await conversation.peerInboxId().catch(() => "")
              return {
                conversation,
                peerInboxId,
              }
            }
        // Rehydrate any saved conversations into XMTP client
        if (loadSavedConversations && Array.isArray(loadSavedConversations)) {
          for (const saved of loadSavedConversations) {
            const [a, b] = saved.participants
            const peer = a?.toLowerCase() === client!.inboxId?.toLowerCase() ? b : a
            if (peer && !convos.find(async (c) => (await c.peerInboxId()) === peer)) {
              try { await client!.conversations.newDm(peer) } catch {}
            }
          }
        }

          }),
        )

        setConversations(
          dedupeByPeer(conversationData).sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)),
        )
      } catch (err) {
        console.error("Failed to load conversations:", err)
      } finally {
        setIsLoading(false)
      }
    }
    // On mount, load saved conversations for this address from Convex so they persist across refreshes
    const loadSaved = async () => {
      try {
        const { api } = await import("@/convex/_generated/api")
        const { useQuery } = await import("convex/react")
        // NOTE: we cannot call useQuery here; instead, we’ll fetch via a simple HTTP action later.
      } catch {}
    }
    loadSaved()


    loadConversations()

    // Set up conversation streaming for new conversations
    const streamConversations = async () => {
      try {
        const stream = await client.conversations.streamDms()
        for await (const conversation of stream) {
          const peerInboxId = await conversation.peerInboxId()
          setConversations((prev) => {
            const next = [
              {
                conversation,
                peerInboxId,
                timestamp: new Date(),
              },
              ...prev,
            ]
            return dedupeByPeer(next)
          })
        }
      } catch (err) {
        console.error("Error streaming conversations:", err)
      }
    }

    streamConversations()
  }, [client, isConnected])

  const createConversation = async (peerAddress: string) => {
    if (!client) throw new Error("XMTP client not initialized")

    try {
      // Convert address -> inboxId
      const inboxId = await new (await import("@xmtp/browser-sdk")).Utils().getInboxIdForIdentifier(
        { identifier: peerAddress, identifierKind: "Ethereum" },
        "production",
      )
      if (!inboxId) throw new Error("No XMTP inbox found for that address")

      const conversation = await client.conversations.newDm(inboxId)
      const newConversationData: ConversationData = {
        conversation,
        peerInboxId: inboxId,
        timestamp: new Date(),
      }

      // Persist in Convex so conversations survive refresh
      try {
        await upsertConversation({ participants: [client.inboxId!, inboxId] })
      } catch {}

      setConversations((prev) => dedupeByPeer([newConversationData, ...prev]))
      return conversation
    } catch (err) {
      console.error("Failed to create conversation:", err)
      throw err
    }
  }

  return {
    conversations,
    isLoading,
    createConversation,
  }
}
