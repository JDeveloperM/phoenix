"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Smile, Paperclip, Hash, Users, Loader2, CheckCheck, Mic, MicOff, Play, Pause, Shield, ShieldCheck, Reply, CornerDownRight } from "lucide-react"
import { useXMTP } from "@/hooks/use-xmtp"
import { useConversations } from "@/hooks/use-conversations"
import { useMessages } from "@/hooks/use-messages"
import { RegistrationStatus } from "@/components/registration-status"
import { PrivacyScoreIndicator } from "@/components/privacy-score-indicator"

import { useProfileByInbox, useProfileByAddress } from "@/hooks/use-profiles"
import { usePeerMap } from "@/hooks/use-peer-map"
import { ContentTypeReaction } from "@/lib/xmtp/reaction-codec"


interface ChatWindowProps {
  conversationId: string | null
  onSelectConversation?: (id: string | null) => void
}

export function ChatWindow({ conversationId, onSelectConversation }: ChatWindowProps) {
  const [message, setMessage] = useState("")
  const [isGroupModalOpen, setGroupModalOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [memberAddress, setMemberAddress] = useState("")
  const [adding, setAdding] = useState(false)
  const [pendingMembers, setPendingMembers] = useState<string[]>([])

  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)


  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({})
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [replyingTo, setReplyingTo] = useState<any>(null)

  const { address, client, isRegistered, registerDevice } = useXMTP()
  const { conversations } = useConversations()

  // Group selection support: if conversationId starts with 'group:', fetch that group conversation
  const [overrideConversation, setOverrideConversation] = useState<any>(null)
  useEffect(() => {
    const load = async () => {
      setOverrideConversation(null)
      if (!client || !conversationId) return
      if (conversationId.startsWith("group:")) {
        try {
          const id = conversationId.slice("group:".length)
          const conv = await client.conversations.getConversationById(id)
          setOverrideConversation(conv || null)
        } catch (e) { console.error("Failed to load group conversation", e) }
      }
    }
    load()
  }, [client, conversationId])

  // Find the current conversation by inboxId (DMs), or use group override
  const currentConversation = overrideConversation || conversations.find((c) => c.peerInboxId === conversationId)?.conversation || null

  // Profiles
  const peerProfile = useProfileByInbox(!conversationId?.startsWith("group:") ? conversationId : null)
  const myProfile = useProfileByAddress(address)

  // For group conversations, get all member profiles
  const [groupMembers, setGroupMembers] = useState<string[]>([])
  useEffect(() => {
    const loadGroupMembers = async () => {
      if (overrideConversation && conversationId?.startsWith("group:")) {
        try {
          const members = await overrideConversation.members()
          const memberIds = (members || []).map((member: any) =>
            typeof member === 'string' ? member : member.inboxId || String(member)
          )
          setGroupMembers(memberIds)
        } catch (e) {
          console.error("Failed to load group members for chat", e)
          setGroupMembers([])
        }
      } else {
        setGroupMembers([])
      }
    }
    loadGroupMembers()
  }, [overrideConversation, conversationId])

  // Get profiles for group members
  const groupMemberProfiles = usePeerMap(groupMembers)

  const { messages, isLoading, canMessagePeer, sendMessage } = useMessages(currentConversation)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        })
      }
    }
  }, [messages])

  // Focus input when conversation changes
  useEffect(() => {
    if (conversationId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [conversationId])

  // Reactions received from the network (ReactionCodec content type)
  const networkReactions = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of messages as any[]) {
      try {
        if (m?.contentType?.toString?.() === ContentTypeReaction.toString() && m?.content) {
          const { refId, emoji } = m.content as any
          if (refId && emoji) map[refId] = emoji
        }
      } catch {}
    }
    return map
  }, [messages])
  // Merge network reactions with optimistic local selections
  const mergedReactions = useMemo(() => ({ ...networkReactions, ...messageReactions }), [networkReactions, messageReactions])

  const handleSendMessage = async () => {
    if (!message.trim() || !currentConversation || isSending) return

    const messageToSend = message
    setMessage("") // Clear input immediately for better UX

    try {
      setSendError(null)
      setIsSending(true)
      await sendMessage(messageToSend)
    } catch (err: any) {
      console.error("Failed to send message:", err)
      setSendError(err?.message || "Failed to send")
      setMessage(messageToSend) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        // Convert to base64 and send as message
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result as string
          await sendMessage(`🎤 Voice message (${recordingTime}s): ${base64}`)
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      recorder.start()

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
          setIsRecording(false)
          clearInterval(timer)
        }
      }, 60000)

    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)

    // Simulate typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimestamp = (ts: Date | bigint | number | undefined) => {
    if (ts === undefined || ts === null) return ""
    // XMTP V3 uses sentAtNs (bigint). Accept Date as well for safety.
    const date = ts instanceof Date ? ts : new Date(Number((ts as any) / BigInt(1_000_000)))
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m ago`

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#1e0606' }}>
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{ backgroundImage: "url('/1.webp')" }}
        ></div>
        <div className="text-center space-y-8 max-w-2xl mx-auto px-6 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-red-900 to-red-800 rounded-full flex items-center justify-center mx-auto shadow-lg border-2 border-red-500/30">
            <Hash className="w-12 h-12 text-red-400" />
          </div>

          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-white">Welcome to Private Messaging</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              Choose a conversation from the sidebar to start chatting, or create a new one to connect with someone on
              the decentralized web.
            </p>
          </div>

          {/* Privacy Score Dashboard Highlight */}
          <div className="bg-gradient-to-r from-red-900/20 via-red-800/30 to-red-900/20 rounded-xl p-6 border border-red-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-red-400" />
              <h4 className="text-xl font-bold text-white">Privacy Score Dashboard</h4>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-gray-300 leading-relaxed">
                <span className="text-red-400 font-semibold">World's first real-time privacy scoring system</span> that continuously monitors and evaluates your digital privacy across multiple dimensions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-cyan-400 font-medium">Encryption Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-medium">Network Security</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-purple-400 font-medium">Device Protection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-yellow-400 font-medium">Metadata Privacy</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-red-500/10">
                <p className="text-gray-400 text-sm italic">
                  "Unlike traditional privacy tools that only protect one aspect, our dashboard provides a comprehensive 360° view of your digital privacy posture with actionable insights and real-time monitoring."
                </p>
              </div>

              <div className="text-center">
                <p className="text-red-300 font-medium">
                  Check your Privacy Score in the sidebar to see how protected you really are.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>XMTP Network Connected • End-to-End Encrypted</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
        style={{ backgroundImage: "url('/1.webp')" }}
      ></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>

      {/* Privacy Score Indicator */}
      <PrivacyScoreIndicator position="top-right" />

      {/* Cyberpunk Chat Header */}
      <div className="p-4 border-b border-cyan-500 bg-gradient-to-r from-black via-cyan-950 to-black backdrop-blur-sm relative" style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'linear-gradient(to right, rgba(0,0,0,0.8), rgba(8,145,178,0.2), rgba(0,0,0,0.8))' }}>
        <div className="flex items-center space-x-4 relative">
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-cyan-500 transition-all duration-300 hover:ring-red-500 cyber-glow-cyan">
              {peerProfile?.avatarUrl ? <AvatarImage src={peerProfile.avatarUrl} alt="avatar" /> : null}
              <AvatarFallback className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-cyan-700 text-white font-bold font-mono">
                {(peerProfile?.displayName || conversationId).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse shadow-lg shadow-green-400/50"></div>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg font-mono tracking-wider cyber-smooth-glow">
              {peerProfile?.displayName || formatAddress(conversationId)}
            </h3>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="border-green-400 bg-green-500 text-white text-xs animate-pulse cyber-glow-cyan backdrop-blur-sm font-mono">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse shadow-lg shadow-green-400/50"></div>
                NEURAL LINK ACTIVE
              </Badge>
              <div className="text-xs text-cyan-400 font-mono tracking-widest opacity-80">ENCRYPTED</div>
              <RegistrationStatus />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
              <p className="text-gray-400">Loading conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-8 h-8 text-gray-600" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-400 font-medium">No messages yet</p>
                <div className="text-gray-500 text-sm">Send the first message to start this decentralized conversation</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages
              .filter((m) => (m as any).contentType?.toString?.() !== ContentTypeReaction.toString())
              .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
              .map((msg, index) => {
              const senderInbox = (msg as any).senderInboxId as string | undefined
              const isOwn = senderInbox && client?.inboxId ? senderInbox === client.inboxId : false
              const prevSender = (messages[index - 1] as any)?.senderInboxId as string | undefined
              const nextSender = (messages[index + 1] as any)?.senderInboxId as string | undefined
              const showAvatar = index === 0 || prevSender !== senderInbox
              const isLastInGroup = index === messages.length - 1 || nextSender !== senderInbox

              return (
                <div
                  key={`${msg.id}-${String((msg as any).sentAtNs ?? "")}`}
                  className={`flex items-end space-x-3 group animate-in slide-in-from-bottom-2 duration-300 ${
                    isOwn ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                  data-msgid={msg.id}
                >
                  {!isOwn && (
                    <Avatar className="w-8 h-8 ring-2 ring-transparent group-hover:ring-gray-600 transition-all duration-200">
                      {(() => {
                        const senderProfile = conversationId?.startsWith("group:")
                          ? (senderInbox ? groupMemberProfiles[senderInbox] : null)
                          : peerProfile
                        return senderProfile?.avatarUrl ? <AvatarImage src={senderProfile.avatarUrl} alt="avatar" /> : null
                      })()}
                      <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-700 text-white text-sm font-semibold">
                        {(() => {
                          const senderProfile = conversationId?.startsWith("group:")
                            ? (senderInbox ? groupMemberProfiles[senderInbox] : null)
                            : peerProfile
                          return (senderProfile?.displayName || senderInbox || "??").slice(0, 2).toUpperCase()
                        })()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {isOwn && (
                    <Avatar className="w-8 h-8 ring-2 ring-transparent group-hover:ring-gray-600 transition-all duration-200">
                      {myProfile?.avatarUrl ? <AvatarImage src={myProfile.avatarUrl} alt="me" /> : null}
                      <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-700 text-white text-sm font-semibold">
                        {(myProfile?.displayName || address || "??").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col max-w-md ${isOwn ? "items-end" : "items-start"}`}>

                    <div
                      className={`relative px-4 py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl backdrop-blur-sm ${
                        isOwn
                          ? "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-500/20"
                          : "bg-gray-800/90 text-white border border-gray-700/50 hover:border-gray-600/70 shadow-gray-900/50"
                      } ${!isLastInGroup ? "mb-1" : "mb-2"}`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{String(msg.content ?? "")}</div>

                      {/* Reaction buttons in a horizontal line above the bubble */}
                      <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 z-10`}>
                        <div className="flex items-center space-x-2 bg-gray-800/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                          {/* Reply button */}
                          <button
                            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all duration-200 flex items-center justify-center hover:scale-110"
                            onClick={() => setReplyingTo(msg)}
                          >
                            <Reply className="w-3 h-3" />
                          </button>

                          {/* Reaction buttons */}
                          <button
                            className="w-8 h-8 hover:bg-gray-700 rounded-full transition-all duration-200 flex items-center justify-center hover:scale-110 text-sm"
                            onClick={async () => {
                              const msgIdStr = `${msg.id}-${String((msg as any).sentAtNs ?? "")}`
                              setMessageReactions(prev => ({ ...prev, [msgIdStr]: "👍" }))
                              try {
                                await currentConversation?.send({ refId: msg.id, emoji: "👍" } as any, ContentTypeReaction as any)
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                          >
                            👍
                          </button>

                          <button
                            className="w-8 h-8 hover:bg-gray-700 rounded-full transition-all duration-200 flex items-center justify-center hover:scale-110 text-sm"
                            onClick={async () => {
                              const msgIdStr = `${msg.id}-${String((msg as any).sentAtNs ?? "")}`
                              setMessageReactions(prev => ({ ...prev, [msgIdStr]: "❤️" }))
                              try {
                                await currentConversation?.send({ refId: msg.id, emoji: "❤️" } as any, ContentTypeReaction as any)
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                          >
                            ❤️
                          </button>

                          <button
                            className="w-8 h-8 hover:bg-gray-700 rounded-full transition-all duration-200 flex items-center justify-center hover:scale-110 text-sm"
                            onClick={async () => {
                              const msgIdStr = `${msg.id}-${String((msg as any).sentAtNs ?? "")}`
                              setMessageReactions(prev => ({ ...prev, [msgIdStr]: "😂" }))
                              try {
                                await currentConversation?.send({ refId: msg.id, emoji: "😂" } as any, ContentTypeReaction as any)
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                          >
                            😂
                          </button>
                        </div>
                      </div>

                      {/* Display reactions */}
                      {mergedReactions[msg.id] && (
                        <div className="absolute -bottom-3 right-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full border border-gray-600">
                          {mergedReactions[msg.id]}
                        </div>
                      )}
                    </div>

                    {/* Show name and timestamp below bubble for both sent and received messages */}
                    {isLastInGroup && (
                      <div className={`flex items-center space-x-2 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-medium text-white">
                          {isOwn
                            ? (myProfile?.displayName || formatAddress(address || "0x??"))
                            : (() => {
                                const senderProfile = conversationId?.startsWith("group:")
                                  ? (senderInbox ? groupMemberProfiles[senderInbox] : null)
                                  : peerProfile
                                return senderProfile?.displayName || formatAddress(senderInbox || "0x??")
                              })()
                          }
                        </span>
                        <span className="text-xs text-gray-500">{formatTimestamp((msg as any).sentAtNs)}</span>
                        {isOwn && (
                          <div className="flex items-center space-x-1">
                            <CheckCheck className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-400">Delivered</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-gray-700/50 rounded-lg border-l-4 border-red-500 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-sm text-red-400">
                <CornerDownRight className="w-4 h-4" />
                <span>Replying to message</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-300 truncate">
              {String(replyingTo.content ?? "").slice(0, 100)}...
            </div>
          </div>
        )}

        <div className="flex items-end space-x-3">
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 mb-2"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={isRecording ? stopRecording : startRecording}
            className={`text-gray-400 hover:text-white transition-all duration-200 mb-2 ${
              isRecording ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'hover:bg-gray-700'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white transition-all duration-200"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            {isSending ? (
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Sending message...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Powered by XMTP • End-to-end encrypted</span>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
