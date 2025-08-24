"use client"

import { useAnyone } from "@/hooks/use-anyone"
import { Shield, ShieldCheck, ShieldX, Wifi, Globe, Zap, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PrivacyStatusProps {
  isExpanded?: boolean
  onToggle?: () => void
}

export function PrivacyStatus({ isExpanded = false, onToggle }: PrivacyStatusProps) {
  const { isConnected, isConnecting, circuitId, relayCount, bandwidth, error, connect, disconnect } = useAnyone()

  const getStatusIcon = () => {
    if (isConnecting) return <Shield className="h-4 w-4 animate-spin" />
    if (isConnected) return <ShieldCheck className="h-4 w-4 text-green-400" />
    return <ShieldX className="h-4 w-4 text-red-400" />
  }

  const getStatusText = () => {
    if (isConnecting) return "Connecting to Anyone Network..."
    if (isConnected) return "Protected by Anyone Protocol"
    return "Privacy Protection Disabled"
  }

  const getStatusColor = () => {
    if (isConnecting) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (isConnected) return "bg-green-500/20 text-green-400 border-green-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  if (!isExpanded) {
    // Compact view for sidebar
    return (
      <div
        className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/50 cursor-pointer hover:bg-gray-800/50 transition-all duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white">
                  {isConnected ? "Protected" : "Unprotected"}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${isConnected ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}`}
                >
                  {isConnected ? "ON" : "OFF"}
                </Badge>
              </div>
              <div className="text-xs text-gray-400">Anyone Protocol</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    )
  }

  // Expanded view
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-sm font-medium">{getStatusText()}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getStatusColor()}>
              {isConnected ? "ACTIVE" : "INACTIVE"}
            </Badge>
            {onToggle && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        {error && <CardDescription className="text-red-400 text-xs">{error}</CardDescription>}
      </CardHeader>

      {isConnected && (
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 text-blue-400" />
              <span className="text-gray-400">Circuit ID:</span>
            </div>
            <span className="font-mono text-blue-400 truncate">{circuitId?.slice(0, 8)}...</span>

            <div className="flex items-center gap-2">
              <Wifi className="h-3 w-3 text-green-400" />
              <span className="text-gray-400">Active Relays:</span>
            </div>
            <span className="text-green-400 font-medium">{relayCount.toLocaleString()}</span>

            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-purple-400" />
              <span className="text-gray-400">Network Bandwidth:</span>
            </div>
            <span className="text-purple-400 font-medium">{bandwidth}</span>
          </div>

          <div className="pt-2 border-t border-gray-700">
            <Button
              onClick={disconnect}
              variant="outline"
              size="sm"
              className="w-full text-xs h-7 border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              Disconnect Privacy Network
            </Button>
          </div>
        </CardContent>
      )}

      {!isConnected && !isConnecting && (
        <CardContent className="pt-0">
          <Button
            onClick={connect}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-7"
            disabled={isConnecting}
          >
            Enable Privacy Protection
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">Route traffic through decentralized onion network</p>
        </CardContent>
      )}
    </Card>
  )
}
