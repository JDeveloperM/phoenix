"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Network,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Globe,
  Lock,
  Wifi,
  WifiOff
} from "lucide-react"
import { usePrivacyScore } from "@/hooks/use-privacy-score"
import { useXMTP } from "@/hooks/use-xmtp"
import { useAnyone } from "@/hooks/use-anyone"
import { PrivacyScoreShare } from "@/components/privacy-score-share"

interface PrivacyDashboardProps {
  isExpanded?: boolean
  onToggle?: () => void
}

export function PrivacyDashboard({ isExpanded = false, onToggle }: PrivacyDashboardProps) {
  const { 
    metrics, 
    insights, 
    networkHealth, 
    isCalculating, 
    lastUpdated, 
    refreshScore, 
    getScoreColor, 
    getScoreLabel 
  } = usePrivacyScore()
  
  const { connectWallet, registerDevice, isRegistered } = useXMTP()
  const { connect: connectAnyone, isConnected: anyoneConnected } = useAnyone()

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <ShieldCheck className="w-5 h-5 text-green-400" />
    if (score >= 70) return <Shield className="w-5 h-5 text-yellow-400" />
    if (score >= 50) return <ShieldAlert className="w-5 h-5 text-orange-400" />
    return <ShieldX className="w-5 h-5 text-red-400" />
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ShieldX className="w-4 h-4 text-red-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      default: return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  const handleInsightAction = async (insight: any) => {
    switch (insight.id) {
      case 'no-xmtp':
        await connectWallet()
        break
      case 'device-not-registered':
        await registerDevice()
        break
      case 'no-anyone':
        await connectAnyone()
        break
      default:
        if (insight.actionCallback) {
          insight.actionCallback()
        }
    }
    // Refresh score after action
    setTimeout(refreshScore, 1000)
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
            {getScoreIcon(metrics.overallScore)}
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-bold font-mono ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getScoreColor(metrics.overallScore)} border-current`}
                >
                  {getScoreLabel(metrics.overallScore)}
                </Badge>
              </div>
              <div className="text-xs text-gray-400">Privacy Score</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isCalculating && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
            <PrivacyScoreShare variant="icon" size="sm" />
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        {/* Network Status & Insights */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Network Status Indicators */}
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                networkHealth.xmtpStatus === 'healthy' ? 'bg-green-500' :
                networkHealth.xmtpStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div className={`w-2 h-2 rounded-full ${
                networkHealth.anyoneStatus === 'healthy' ? 'bg-green-500' :
                networkHealth.anyoneStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>

            {/* Insights count */}
            {insights.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {insights.slice(0, 3).map((insight, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-current opacity-60"
                         style={{ color: insight.type === 'critical' ? '#ef4444' : insight.type === 'warning' ? '#f59e0b' : '#10b981' }} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  {insights.length} insight{insights.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Quick network info */}
          <div className="text-xs text-gray-500">
            {networkHealth.xmtpLatency > 0 && `${networkHealth.xmtpLatency}ms`}
          </div>
        </div>
      </div>
    )
  }

  // Expanded dashboard view
  return (
    <Card className="bg-gray-800/90 border-gray-700 text-white backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {getScoreIcon(metrics.overallScore)}
            <span>Privacy Dashboard</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={refreshScore}
              disabled={isCalculating}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
            </Button>
            {onToggle && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        
        {/* Overall Score */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Overall Privacy Score</span>
            <span className={`text-2xl font-bold font-mono ${getScoreColor(metrics.overallScore)} transition-all duration-500`}>
              {isCalculating ? (
                <span className="animate-pulse">--</span>
              ) : (
                <span className="animate-in fade-in-0 duration-1000">
                  {metrics.overallScore}/100
                </span>
              )}
            </span>
          </div>
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                metrics.overallScore >= 90 ? 'bg-green-500' :
                metrics.overallScore >= 70 ? 'bg-yellow-500' :
                metrics.overallScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${metrics.overallScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`${getScoreColor(metrics.overallScore)} border-current`}
              >
                {getScoreLabel(metrics.overallScore)}
              </Badge>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <PrivacyScoreShare variant="icon" size="sm" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4 mt-4">
            {/* Individual Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Encryption</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        metrics.encryptionScore >= 90 ? 'bg-green-500' :
                        metrics.encryptionScore >= 70 ? 'bg-yellow-500' :
                        metrics.encryptionScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.encryptionScore}%` }}
                    />
                  </div>
                  <span className={`text-sm font-mono ${getScoreColor(metrics.encryptionScore)}`}>
                    {metrics.encryptionScore}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Network</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        metrics.networkScore >= 90 ? 'bg-green-500' :
                        metrics.networkScore >= 70 ? 'bg-yellow-500' :
                        metrics.networkScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.networkScore}%` }}
                    />
                  </div>
                  <span className={`text-sm font-mono ${getScoreColor(metrics.networkScore)}`}>
                    {metrics.networkScore}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Device</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        metrics.deviceScore >= 90 ? 'bg-green-500' :
                        metrics.deviceScore >= 70 ? 'bg-yellow-500' :
                        metrics.deviceScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.deviceScore}%` }}
                    />
                  </div>
                  <span className={`text-sm font-mono ${getScoreColor(metrics.deviceScore)}`}>
                    {metrics.deviceScore}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <EyeOff className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">Metadata</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden mr-2">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        metrics.metadataScore >= 90 ? 'bg-green-500' :
                        metrics.metadataScore >= 70 ? 'bg-yellow-500' :
                        metrics.metadataScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metrics.metadataScore}%` }}
                    />
                  </div>
                  <span className={`text-sm font-mono ${getScoreColor(metrics.metadataScore)}`}>
                    {metrics.metadataScore}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
              {insights.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p>No privacy issues detected!</p>
                </div>
              ) : (
                insights.map((insight) => (
                <div 
                  key={insight.id}
                  className="p-3 bg-gray-700/50 rounded-lg border-l-4"
                  style={{ 
                    borderLeftColor: insight.type === 'critical' ? '#ef4444' : 
                                   insight.type === 'warning' ? '#f59e0b' : 
                                   insight.type === 'success' ? '#10b981' : '#3b82f6' 
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{insight.title}</h4>
                        <p className="text-sm text-gray-300 mt-1">{insight.description}</p>
                        {insight.impact > 0 && (
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-400">Impact:</span>
                            <Badge variant="outline" className="text-xs">
                              -{insight.impact} points
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInsightAction(insight)}
                        className="ml-2 text-xs"
                      >
                        {insight.action}
                      </Button>
                    )}
                    </div>
                  </div>
                ))
              )}

              {/* Share Section */}
              <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white mb-1">Share Your Privacy Score</h4>
                    <p className="text-xs text-gray-400">Show others your commitment to privacy</p>
                  </div>
                  <PrivacyScoreShare size="sm" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-4 mt-4">
            {/* Network Health */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-700/30 rounded-lg">
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">XMTP Network</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      networkHealth.xmtpStatus === 'healthy' ? 'text-green-400 border-green-400' :
                      networkHealth.xmtpStatus === 'degraded' ? 'text-yellow-400 border-yellow-400' :
                      'text-red-400 border-red-400'
                    }`}
                  >
                    {networkHealth.xmtpStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Latency: {networkHealth.xmtpLatency.toFixed(0)}ms</div>
                  <div>Nodes: {networkHealth.xmtpNodes}</div>
                </div>
              </div>

              <div className="p-3 bg-gray-700/30 rounded-lg">
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Anyone Protocol</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      networkHealth.anyoneStatus === 'healthy' ? 'text-green-400 border-green-400' :
                      networkHealth.anyoneStatus === 'degraded' ? 'text-yellow-400 border-yellow-400' :
                      'text-red-400 border-red-400'
                    }`}
                  >
                    {networkHealth.anyoneStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Latency: {networkHealth.anyoneLatency.toFixed(0)}ms</div>
                  <div>Relays: {networkHealth.anyoneRelays}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
