"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Plus, Settings, LogOut, Loader2, MoreVertical, Copy, RefreshCw, MessageCircle, Filter } from "lucide-react"
import { useXMTP } from "@/hooks/use-xmtp"
import { useConversations } from "@/hooks/use-conversations"
import { PrivacyStatus } from "@/components/privacy-status"
import { ManageDevices } from "@/components/manage-devices"
import { PrivacyDashboard } from "@/components/privacy-dashboard"
import Link from "next/link"
import { usePeerMap } from "@/hooks/use-peer-map"
import { useProfileByAddress } from "@/hooks/use-profiles"
import { toast } from "@/hooks/use-toast"


interface ChatSidebarProps {
  selectedConversation: string | null
  onSelectConversation: (id: string) => void
}

export function ChatSidebar({ selectedConversation, onSelectConversation }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [newConversationAddress, setNewConversationAddress] = useState("") // Ethereum address that we'll convert to inboxId under the hood
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)
  const [manageDevicesOpen, setManageDevicesOpen] = useState(false)

  const { address, ensName, disconnect, switchAccount, client, isConnected } = useXMTP()
  const { conversations, isLoading, createConversation } = useConversations()

  const handleCreateConversation = async () => {
    if (!newConversationAddress.trim()) return

    try {
      setIsCreatingConversation(true)
      await createConversation(newConversationAddress)
      setNewConversationAddress("")
      setShowNewConversationDialog(false)
    } catch (err) {
      console.error("Failed to create conversation:", err)
    } finally {
      setIsCreatingConversation(false)
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({ title: "Address copied", description: address })
    }
  }

  const myProfile = useProfileByAddress(address)

  const peerMap = usePeerMap(conversations.map(c => c.peerInboxId))


  const filteredConversations = conversations.filter((conv) =>
    conv.peerInboxId.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return ""
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
  const [groups, setGroups] = useState<any[]>([])
  const [groupMembers, setGroupMembers] = useState<Record<string, string[]>>({})
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<{groupName: string, members: string[]}>({groupName: '', members: []})
  const [showPrivacyDashboard, setShowPrivacyDashboard] = useState(false)
  const [showPrivacyStatus, setShowPrivacyStatus] = useState(false)

  useEffect(() => {
    if (!client || !isConnected) {
      setGroups([])
      setGroupMembers({})
      return
    }

    let cancelled = false

    const loadGroups = async () => {
      try {
        const list = await client.conversations.listGroups()
        if (!cancelled) {
          setGroups(list)
          // Load members for each group
          const membersMap: Record<string, string[]> = {}
          for (const group of list) {
            try {
              const members = await group.members()
              // Extract inboxId from member objects
              membersMap[group.id] = (members || []).map((member: any) =>
                typeof member === 'string' ? member : member.inboxId || String(member)
              )
            } catch (e) {
              console.error(`Failed to load members for group ${group.id}`, e)
              membersMap[group.id] = []
            }
          }
          setGroupMembers(membersMap)
        }
      } catch (e) { console.error("Failed to list groups", e) }
    }

    const streamGroups = async () => {
      try {
        const stream = await client.conversations.streamGroups()
        for await (const group of stream) {
          if (cancelled) break
          setGroups(prev => {
            const exists = prev.find(g => g.id === group.id)
            if (exists) return prev
            return [group, ...prev]
          })
          // Load members for new group
          try {
            const members = await group.members()
            // Extract inboxId from member objects
            const memberIds = (members || []).map((member: any) =>
              typeof member === 'string' ? member : member.inboxId || String(member)
            )
            setGroupMembers(prev => ({
              ...prev,
              [group.id]: memberIds
            }))
          } catch (e) {
            console.error(`Failed to load members for new group ${group.id}`, e)
          }
        }
      } catch (e) { console.error("Failed to stream groups", e) }
    }

    loadGroups()
    streamGroups()

    return () => { cancelled = true }
  }, [client, isConnected])

  // Get profiles for all group members
  const allGroupMemberIds = Object.values(groupMembers).flat()
  const groupMemberProfiles = usePeerMap(allGroupMemberIds)

  // Debug logging
  useEffect(() => {
    if (allGroupMemberIds.length > 0) {
      console.log("Group member IDs:", allGroupMemberIds)
      console.log("Group member profiles:", groupMemberProfiles)
    }
  }, [allGroupMemberIds, groupMemberProfiles])


  return (
    <div className="w-80 bg-gradient-to-b from-black/95 via-red-950/20 to-black/95 backdrop-blur-xl border-r border-red-500/30 flex flex-col relative overflow-hidden">
      {/* Cyberpunk Background Effects */}
      <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] opacity-5"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

      {/* Scanning Line Animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-400/50 to-transparent animate-cyber-scan"></div>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-red-500/30 bg-gradient-to-r from-black/80 via-red-950/30 to-black/80 backdrop-blur-sm relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 via-red-500 to-red-700 rounded-lg flex items-center justify-center cyber-glow-red shadow-lg shadow-red-500/30">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white cyber-smooth-glow font-mono tracking-wider">PHENIX</h2>
              <div className="text-xs text-cyan-400 font-mono tracking-widest opacity-80">NEURAL LINK</div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant="outline" className="border-green-400/50 bg-green-500/10 text-green-400 text-xs animate-pulse cyber-glow-cyan backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="font-mono">ONLINE</span>
            </Badge>
            <div className="text-xs text-gray-400 font-mono">SECURE</div>
          </div>
        </div>

        {/* Cyberpunk Search Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-cyan-400/20 to-red-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-4 h-4 z-10" />
            <Input
              placeholder="SCAN NEURAL NETWORKS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-black/60 border border-red-500/30 text-white placeholder-cyan-400/60 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 font-mono text-sm backdrop-blur-sm cyber-glow-red"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-cyan-400 hover:text-white hover:bg-red-500/20 rounded transition-all duration-200"
            >
              <Filter className="w-3 h-3" />
            </Button>
          </div>
          {/* Search bar glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/10 via-transparent to-cyan-400/10 opacity-50"></div>
        </div>
      </div>

      {/* Cyberpunk Privacy Score Dashboard */}
      <div className="p-4 border-b border-red-500/30 bg-gradient-to-r from-black/60 via-red-950/20 to-black/60 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-cyan-400/5 to-red-500/5"></div>
        <div className="relative">
          <PrivacyDashboard
            isExpanded={showPrivacyDashboard}
            onToggle={() => setShowPrivacyDashboard(!showPrivacyDashboard)}
          />
        </div>
      </div>

      {/* Anyone Protocol Privacy Status (hidden when dashboard is expanded) */}
      {!showPrivacyDashboard && (
        <div className="p-4 border-b border-red-500/30 bg-gradient-to-r from-black/60 via-red-950/20 to-black/60 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-cyan-400/5 to-red-500/5"></div>
          <div className="relative">
            <PrivacyStatus
              isExpanded={showPrivacyStatus}
              onToggle={() => setShowPrivacyStatus(!showPrivacyStatus)}
            />
          </div>
        </div>
      )}

      {/* Cyberpunk Conversations */}
      <ScrollArea className="flex-1 relative">
        <div className="p-2 relative">
          {/* Background circuit pattern */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>

          <Tabs defaultValue="dms" className="w-full relative">
            <div className="flex items-center justify-between mb-3 px-2">
              <TabsList className="bg-black/60 border border-red-500/30 text-gray-300 backdrop-blur-sm cyber-glow-red">
                <TabsTrigger
                  value="dms"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600/30 data-[state=active]:to-red-700/30 data-[state=active]:text-white data-[state=active]:border-red-400/50 font-mono text-xs tracking-wider transition-all duration-300"
                >
                  DIRECT LINKS
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600/30 data-[state=active]:to-cyan-700/30 data-[state=active]:text-white data-[state=active]:border-cyan-400/50 font-mono text-xs tracking-wider transition-all duration-300"
                >
                  NEURAL NETS
                </TabsTrigger>
              </TabsList>
              <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-cyan-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600/30 hover:to-cyan-600/30 rounded-lg transition-all duration-300 cyber-glow-cyan border border-cyan-400/30"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gradient-to-br from-black/95 via-red-950/30 to-black/95 border border-red-500/50 rounded-xl backdrop-blur-xl cyber-glow-red">
                  <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] opacity-10 rounded-xl"></div>
                  <DialogHeader className="relative">
                    <DialogTitle className="text-white text-xl font-mono tracking-wider cyber-smooth-glow">
                      <span className="text-cyan-400">[INIT]</span> NEW NEURAL LINK
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 relative">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-cyan-400 font-mono tracking-wider">TARGET ADDRESS</label>
                      <div className="relative group">
                        <Input
                          placeholder="0x... ETHEREUM WALLET ADDRESS"
                          value={newConversationAddress}
                          onChange={(e) => setNewConversationAddress(e.target.value)}
                          className="bg-black/60 border border-red-500/30 text-white placeholder-cyan-400/60 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 font-mono text-sm backdrop-blur-sm transition-all duration-300"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/10 via-transparent to-cyan-400/10 opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateConversation}
                      disabled={!newConversationAddress.trim() || isCreatingConversation}
                      className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white rounded-xl py-3 transition-all duration-300 font-mono tracking-wider cyber-glow-red shadow-lg shadow-red-500/30"
                    >
                      {isCreatingConversation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span className="text-cyan-400">[CONNECTING...]</span>
                        </>
                      ) : (
                        <>
                          <span className="text-cyan-400">[ESTABLISH]</span> LINK
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value="dms" className="relative">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <div className="relative">
                        <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                        <div className="absolute inset-0 w-8 h-8 border-2 border-cyan-400/30 rounded-full animate-pulse mx-auto"></div>
                      </div>
                      <p className="text-cyan-400 text-sm font-mono tracking-wider">
                        <span className="text-red-400">[SCANNING]</span> NEURAL NETWORKS...
                      </p>
                    </div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-cyan-400/5 rounded-xl"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-600/20 to-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4 cyber-glow-red border border-red-500/30">
                        <MessageCircle className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-cyan-400 text-sm font-medium mb-1 font-mono tracking-wider">
                        <span className="text-red-400">[NO LINKS]</span> DETECTED
                      </p>
                      <p className="text-gray-400 text-xs leading-relaxed font-mono">
                        Initialize neural connection to access the decentralized matrix
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 relative">
                    {filteredConversations.map((conversationData, index) => (
                      <div
                        key={conversationData.peerInboxId}
                        onClick={() => onSelectConversation(conversationData.peerInboxId)}
                        className={`relative flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden ${
                          selectedConversation === conversationData.peerInboxId
                            ? "bg-gradient-to-r from-red-600/30 via-red-500/20 to-red-700/30 border border-red-400/50 shadow-lg shadow-red-500/20 cyber-glow-red"
                            : "hover:bg-gradient-to-r hover:from-red-500/10 hover:via-black/20 hover:to-cyan-500/10 border border-transparent hover:border-red-500/20"
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Background scanning effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10">
                          <div className="relative">
                            <Avatar className="w-12 h-12 ring-2 ring-red-500/30 group-hover:ring-cyan-400/50 transition-all duration-300 cyber-glow-red">
                              {peerMap[conversationData.peerInboxId]?.avatarUrl ? (
                                <AvatarImage src={peerMap[conversationData.peerInboxId]!.avatarUrl!} alt="avatar" />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-red-600 via-red-500 to-red-700 text-white text-sm font-bold font-mono">
                                {(peerMap[conversationData.peerInboxId]?.displayName || conversationData.peerInboxId).slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse shadow-lg shadow-green-400/50"></div>
                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 relative z-10">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-white truncate font-mono tracking-wide">
                              {peerMap[conversationData.peerInboxId]?.displayName || formatAddress(conversationData.peerInboxId)}
                            </p>
                            <span className="text-xs text-cyan-400 font-mono">{formatTimestamp(conversationData.timestamp)}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate font-mono">
                            {conversationData.lastMessage || "[NO DATA STREAM]"}
                          </p>
                        </div>

                        {/* Selection indicator */}
                        {selectedConversation === conversationData.peerInboxId && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-cyan-400 to-red-400 animate-pulse"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>




            <TabsContent value="groups" className="relative">
              {groups.length === 0 ? (
                <div className="text-center py-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-400/5 rounded-xl"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600/20 to-cyan-700/20 rounded-full flex items-center justify-center mx-auto mb-3 cyber-glow-cyan border border-cyan-500/30">
                      <MessageCircle className="w-6 h-6 text-cyan-400" />
                    </div>
                    <p className="text-cyan-400 text-xs font-mono tracking-wider">
                      <span className="text-red-400">[NO NETWORKS]</span> DETECTED
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {groups.map((group: any) => {
                    const members = groupMembers[group.id] || []
                    const displayMembers = members.slice(0, 3) // Show first 3 member avatars

                    return (
                      <div
                        key={group.id}
                        onClick={() => onSelectConversation(`group:${group.id}`)}
                        className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                          selectedConversation === `group:${group.id}`
                            ? "bg-gradient-to-r from-red-600/20 to-red-700/20 border-l-4 border-red-500 shadow-lg"
                            : "hover:bg-gray-700/50"
                        }`}
                      >
                        {/* Group avatar - side by side member avatars */}
                        <div className="relative flex-shrink-0">
                          {displayMembers.length > 0 ? (
                            <div className="flex -space-x-2">
                              {displayMembers.map((memberId, index) => (
                                <Avatar
                                  key={memberId}
                                  className={`w-10 h-10 ring-2 ring-gray-800 ${
                                    index === 0 ? 'z-30' : index === 1 ? 'z-20' : 'z-10'
                                  }`}
                                >
                                  {groupMemberProfiles[memberId]?.avatarUrl ? (
                                    <AvatarImage src={groupMemberProfiles[memberId].avatarUrl} alt="member" />
                                  ) : null}
                                  <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-700 text-white text-sm font-semibold">
                                    {(() => {
                                      const profile = groupMemberProfiles[memberId]
                                      const fallbackText = profile?.displayName || String(memberId || "?")
                                      console.log(`Avatar fallback for ${memberId}:`, { profile, fallbackText })
                                      return fallbackText.slice(0, 1).toUpperCase()
                                    })()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {members.length > 3 && (
                                <div
                                  className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-xs text-white font-bold ring-2 ring-gray-800 z-0 cursor-pointer hover:bg-gray-500 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedGroupMembers({
                                      groupName: group.name || `Group ${group.id.slice(0,6)}`,
                                      members
                                    })
                                    setShowMembersModal(true)
                                  }}
                                >
                                  +{members.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-white font-semibold">
                              {(group.name || group.id).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-white truncate">
                              {group.name || `Group ${group.id.slice(0,6)}`}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {members.length} {members.length === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>






            </Tabs>
          </div>
        </ScrollArea>

        {/* Cyberpunk User Profile */}
        <div className="p-4 border-t border-red-500/30 bg-gradient-to-r from-black/80 via-red-950/30 to-black/80 backdrop-blur-sm relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-cyan-400/5 to-red-500/5"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-pulse"></div>

          <div className="flex items-center space-x-3 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-cyan-500/20 rounded-full blur-sm animate-pulse"></div>
              <Avatar className="w-12 h-12 ring-2 ring-red-500/50 cyber-glow-red relative">
                {myProfile?.avatarUrl ? <AvatarImage src={myProfile.avatarUrl} alt="me" /> : null}
                <AvatarFallback className="bg-gradient-to-br from-red-600 via-red-500 to-red-700 text-white font-bold font-mono">
                  {(myProfile?.displayName || address || "??").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-black animate-pulse shadow-lg shadow-green-400/50"></div>
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate font-mono tracking-wider cyber-smooth-glow">
                {myProfile?.displayName || ensName || "NEURAL OPERATOR"}
              </p>
              <p className="text-xs text-cyan-400 font-mono">{address ? formatAddress(address) : "[NO ADDRESS]"}</p>
              <div className="text-xs text-gray-400 font-mono tracking-widest opacity-60">AUTHENTICATED</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-cyan-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600/30 hover:to-cyan-600/30 rounded-lg transition-all duration-300 cyber-glow-cyan border border-cyan-400/30"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gradient-to-br from-black/95 via-red-950/30 to-black/95 border border-red-500/50 rounded-xl backdrop-blur-xl cyber-glow-red">
                <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] opacity-10 rounded-xl"></div>
                <DropdownMenuItem onClick={copyAddress} className="text-cyan-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-cyan-600/20 rounded-lg font-mono text-xs tracking-wider relative">
                  <Copy className="w-4 h-4 mr-2" />
                  COPY ADDRESS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={switchAccount} className="text-cyan-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-cyan-600/20 rounded-lg font-mono text-xs tracking-wider relative">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  SWITCH ACCOUNT
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-red-500/30" />
                <DropdownMenuItem className="text-cyan-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-cyan-600/20 rounded-lg font-mono text-xs tracking-wider relative" asChild>
                  <Link href="/profile" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    PROFILE
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-cyan-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-cyan-600/20 rounded-lg font-mono text-xs tracking-wider relative" asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    SETTINGS
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-cyan-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-cyan-600/20 rounded-lg font-mono text-xs tracking-wider relative" onClick={() => setManageDevicesOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  MANAGE DEVICES
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { disconnect(); toast({ title: "Disconnected" }) }} className="text-red-400 hover:bg-gradient-to-r hover:from-red-600/30 hover:to-red-700/30 rounded-lg font-mono text-xs tracking-wider relative">
                  <LogOut className="w-4 h-4 mr-2" />
                  DISCONNECT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={manageDevicesOpen} onOpenChange={setManageDevicesOpen}>
              <DialogContent className="bg-gradient-to-br from-black/95 via-red-950/30 to-black/95 border border-red-500/50 sm:max-w-[500px] rounded-xl backdrop-blur-xl cyber-glow-red">
                <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] opacity-10 rounded-xl"></div>
                <DialogHeader className="relative">
                  <DialogTitle className="text-white font-mono tracking-wider cyber-smooth-glow">
                    <span className="text-cyan-400">[MANAGE]</span> XMTP DEVICES
                  </DialogTitle>
                </DialogHeader>
                <div className="relative">
                  <ManageDevices />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Cyberpunk Group Members Modal */}
        <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
          <DialogContent className="bg-gradient-to-br from-black/95 via-cyan-950/30 to-black/95 border border-cyan-500/50 text-white max-w-md rounded-xl backdrop-blur-xl cyber-glow-cyan">
            <div className="absolute inset-0 bg-[url('/circuit-pattern.svg')] opacity-10 rounded-xl"></div>
            <DialogHeader className="relative">
              <DialogTitle className="text-white text-lg font-mono tracking-wider cyber-smooth-glow">
                <span className="text-cyan-400">[NETWORK]</span> {selectedGroupMembers.groupName}
                <div className="text-sm text-gray-400 font-mono tracking-widest">MEMBERS</div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto relative">
              {selectedGroupMembers.members.map((memberId, index) => (
                <div
                  key={memberId}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-cyan-600/10 hover:to-cyan-700/10 border border-transparent hover:border-cyan-500/20 transition-all duration-300 relative group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Avatar className="w-10 h-10 ring-2 ring-cyan-500/30 group-hover:ring-cyan-400/50 transition-all duration-300 relative">
                    {groupMemberProfiles[memberId]?.avatarUrl ? (
                      <AvatarImage src={groupMemberProfiles[memberId].avatarUrl} alt="member" />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white text-sm font-bold font-mono">
                      {(groupMemberProfiles[memberId]?.displayName || String(memberId || "?")).slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 relative">
                    <p className="text-sm font-medium text-white truncate font-mono tracking-wide">
                      {groupMemberProfiles[memberId]?.displayName || formatAddress(memberId)}
                    </p>
                    <p className="text-xs text-cyan-400 truncate font-mono">
                      {formatAddress(memberId)}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60"></div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
