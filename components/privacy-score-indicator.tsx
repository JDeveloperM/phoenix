"use client"

import { useState } from "react"
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Eye, EyeOff } from "lucide-react"
import { usePrivacyScore } from "@/hooks/use-privacy-score"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PrivacyScoreIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  showLabel?: boolean
}

export function PrivacyScoreIndicator({ 
  position = 'top-right', 
  showLabel = true 
}: PrivacyScoreIndicatorProps) {
  const { metrics, getScoreColor, getScoreLabel, isCalculating } = usePrivacyScore()
  const [isVisible, setIsVisible] = useState(true)

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <ShieldCheck className="w-4 h-4" />
    if (score >= 70) return <Shield className="w-4 h-4" />
    if (score >= 50) return <ShieldAlert className="w-4 h-4" />
    return <ShieldX className="w-4 h-4" />
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      default:
        return 'top-4 right-4'
    }
  }

  if (!isVisible) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsVisible(true)}
        className={`fixed ${getPositionClasses()} z-50 w-8 h-8 p-0 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm border border-gray-600/50 rounded-full`}
      >
        <Eye className="w-4 h-4 text-gray-400" />
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`fixed ${getPositionClasses()} z-50 animate-in slide-in-from-top-2 duration-500`}>
            <div className="flex items-center space-x-2 bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-full px-3 py-2 shadow-lg">
              <div className={`${getScoreColor(metrics.overallScore)} transition-colors duration-300`}>
                {isCalculating ? (
                  <Shield className="w-4 h-4 animate-pulse" />
                ) : (
                  getScoreIcon(metrics.overallScore)
                )}
              </div>
              
              {showLabel && (
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-bold font-mono ${getScoreColor(metrics.overallScore)} transition-colors duration-300`}>
                    {isCalculating ? '--' : metrics.overallScore}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getScoreColor(metrics.overallScore)} border-current opacity-80`}
                  >
                    {isCalculating ? 'CALC' : getScoreLabel(metrics.overallScore)}
                  </Badge>
                </div>
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="w-6 h-6 p-0 text-gray-400 hover:text-white opacity-60 hover:opacity-100"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
            
            {/* Pulse animation for low scores */}
            {metrics.overallScore < 50 && !isCalculating && (
              <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-ping" />
            )}
            
            {/* Glow effect for high scores */}
            {metrics.overallScore >= 90 && !isCalculating && (
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gray-800 border-gray-700 text-white">
          <div className="space-y-1">
            <div className="font-medium">Privacy Score: {metrics.overallScore}/100</div>
            <div className="text-xs text-gray-300">
              Encryption: {metrics.encryptionScore} • Network: {metrics.networkScore}
            </div>
            <div className="text-xs text-gray-300">
              Device: {metrics.deviceScore} • Metadata: {metrics.metadataScore}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
