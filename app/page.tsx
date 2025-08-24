"use client"

import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatWindow } from "@/components/chat-window"
import { WelcomeScreen } from "@/components/welcome-screen"
import { useXMTP } from "@/hooks/use-xmtp"
import { useState } from "react"

function ChatAppContent() {
  const { isConnected } = useXMTP()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)

  if (!isConnected) {
    return <WelcomeScreen />
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ChatSidebar selectedConversation={selectedConversation} onSelectConversation={setSelectedConversation} />
      <ChatWindow conversationId={selectedConversation} onSelectConversation={setSelectedConversation} />
    </div>
  )
}

export default function ChatApp() {
  return <ChatAppContent />
}
