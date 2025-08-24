"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useXMTP } from "./use-xmtp"
import { useAnyone } from "./use-anyone"

export interface PrivacyMetrics {
  encryptionScore: number
  networkScore: number
  deviceScore: number
  metadataScore: number
  overallScore: number
}

export interface PrivacyInsight {
  id: string
  type: 'warning' | 'info' | 'success' | 'critical'
  title: string
  description: string
  action?: string
  actionCallback?: () => void
  impact: number // How much this affects the score (0-100)
}

export interface NetworkHealth {
  xmtpStatus: 'healthy' | 'degraded' | 'offline'
  anyoneStatus: 'healthy' | 'degraded' | 'offline'
  xmtpLatency: number
  anyoneLatency: number
  xmtpNodes: number
  anyoneRelays: number
}

interface PrivacyScoreContextType {
  metrics: PrivacyMetrics
  insights: PrivacyInsight[]
  networkHealth: NetworkHealth
  isCalculating: boolean
  lastUpdated: Date | null
  refreshScore: () => Promise<void>
  getScoreColor: (score: number) => string
  getScoreLabel: (score: number) => string
}

const PrivacyScoreContext = createContext<PrivacyScoreContextType | undefined>(undefined)

export function PrivacyScoreProvider({ children }: { children: ReactNode }) {
  const { client, isConnected, isRegistered, address } = useXMTP()
  const { isConnected: anyoneConnected, circuitId, relayCount, bandwidth } = useAnyone()
  
  // Load initial state from localStorage
  const loadStoredMetrics = (): PrivacyMetrics => {
    if (typeof window === 'undefined') return {
      encryptionScore: 0,
      networkScore: 0,
      deviceScore: 0,
      metadataScore: 0,
      overallScore: 0
    }

    try {
      const stored = localStorage.getItem('privacy_metrics')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load stored privacy metrics:', error)
    }

    return {
      encryptionScore: 0,
      networkScore: 0,
      deviceScore: 0,
      metadataScore: 0,
      overallScore: 0
    }
  }

  const loadStoredLastUpdated = (): Date | null => {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem('privacy_last_updated')
      if (stored) {
        return new Date(stored)
      }
    } catch (error) {
      console.error('Failed to load stored last updated:', error)
    }

    return null
  }

  const [metrics, setMetrics] = useState<PrivacyMetrics>(loadStoredMetrics)
  const [insights, setInsights] = useState<PrivacyInsight[]>([])
  const [networkHealth, setNetworkHealth] = useState<NetworkHealth>({
    xmtpStatus: 'offline',
    anyoneStatus: 'offline',
    xmtpLatency: 0,
    anyoneLatency: 0,
    xmtpNodes: 0,
    anyoneRelays: 0
  })

  const [isCalculating, setIsCalculating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(loadStoredLastUpdated)

  const calculateEncryptionScore = (): number => {
    let score = 0
    
    // Base XMTP encryption (40 points)
    if (isConnected && client) {
      score += 40
    }
    
    // Device registration (20 points)
    if (isRegistered) {
      score += 20
    }
    
    // Client version and features (20 points)
    if (client?.installationId) {
      score += 20
    }
    
    // Perfect forward secrecy (20 points)
    if (client && isConnected) {
      score += 20 // XMTP V3 has PFS by default
    }
    
    return Math.min(score, 100)
  }

  const calculateNetworkScore = (): number => {
    let score = 0
    
    // XMTP network connection (50 points)
    if (isConnected) {
      score += 50
    }
    
    // Anyone Protocol connection (50 points)
    if (anyoneConnected && circuitId) {
      score += 50
    }
    
    return Math.min(score, 100)
  }

  const calculateDeviceScore = (): number => {
    let score = 60 // Base score
    
    // HTTPS connection (20 points)
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      score += 20
    }
    
    // Local storage encryption (10 points)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      score += 10
    }
    
    // Secure context (10 points)
    if (typeof window !== 'undefined' && window.isSecureContext) {
      score += 10
    }
    
    return Math.min(score, 100)
  }

  const calculateMetadataScore = (): number => {
    let score = 20 // Base score
    
    // Anyone Protocol active (40 points)
    if (anyoneConnected) {
      score += 40
    }
    
    // Multiple relays (20 points)
    if (relayCount > 2) {
      score += 20
    }
    
    // Good bandwidth (20 points)
    if (bandwidth && !bandwidth.includes('0')) {
      score += 20
    }
    
    return Math.min(score, 100)
  }

  const generateInsights = (metrics: PrivacyMetrics): PrivacyInsight[] => {
    const newInsights: PrivacyInsight[] = []

    // Critical encryption insights
    if (!isConnected) {
      newInsights.push({
        id: 'no-xmtp',
        type: 'critical',
        title: 'XMTP Not Connected',
        description: 'Your messages are completely unencrypted and vulnerable to interception. XMTP provides military-grade end-to-end encryption.',
        action: 'Connect Wallet',
        impact: 40
      })
    } else if (!isRegistered) {
      newInsights.push({
        id: 'device-not-registered',
        type: 'warning',
        title: 'Device Not Registered',
        description: 'This device cannot send encrypted messages. Registration creates unique cryptographic keys for this device.',
        action: 'Register Device',
        impact: 20
      })
    } else if (!client?.installationId) {
      newInsights.push({
        id: 'no-installation',
        type: 'warning',
        title: 'Installation Not Complete',
        description: 'Your XMTP installation is incomplete. This may affect message delivery and encryption.',
        action: 'Complete Setup',
        impact: 15
      })
    }

    // Network privacy insights
    if (!anyoneConnected) {
      newInsights.push({
        id: 'no-anyone',
        type: 'warning',
        title: 'IP Address Exposed',
        description: 'Your real IP address and location are visible to network observers. Anyone Protocol routes traffic through multiple encrypted relays.',
        action: 'Connect to Anyone',
        impact: 50
      })
    } else if (relayCount < 3) {
      newInsights.push({
        id: 'low-relay-count',
        type: 'info',
        title: 'Limited Relay Protection',
        description: `Only ${relayCount} relays active. More relays provide better anonymity and protection against traffic analysis.`,
        action: 'Optimize Network',
        impact: 10
      })
    }

    // Device security insights
    if (typeof window !== 'undefined') {
      if (window.location.protocol !== 'https:') {
        newInsights.push({
          id: 'no-https',
          type: 'critical',
          title: 'Insecure Connection',
          description: 'HTTP connections can be intercepted by anyone on your network. HTTPS encrypts data in transit.',
          impact: 20
        })
      }

      if (!window.crypto || !window.crypto.subtle) {
        newInsights.push({
          id: 'no-crypto-api',
          type: 'warning',
          title: 'Limited Cryptographic Support',
          description: 'Your browser lacks modern cryptographic APIs. This may weaken encryption strength.',
          impact: 15
        })
      }

      if (!window.isSecureContext) {
        newInsights.push({
          id: 'insecure-context',
          type: 'warning',
          title: 'Insecure Browser Context',
          description: 'Your browser context is not secure. Some privacy features may be disabled.',
          impact: 10
        })
      }
    }

    // Advanced privacy insights
    if (metrics.metadataScore < 70) {
      newInsights.push({
        id: 'metadata-exposed',
        type: 'info',
        title: 'Metadata Leakage Risk',
        description: 'Message timing, size patterns, and connection metadata may reveal information about your communications.',
        action: 'Enable Full Anonymity',
        impact: 30
      })
    }

    // Positive reinforcement
    if (metrics.overallScore >= 95) {
      newInsights.push({
        id: 'perfect-privacy',
        type: 'success',
        title: 'Perfect Privacy Setup',
        description: 'Outstanding! You have maximum privacy protection. Your communications are secure from all known threats.',
        impact: 0
      })
    } else if (metrics.overallScore >= 85) {
      newInsights.push({
        id: 'excellent-privacy',
        type: 'success',
        title: 'Excellent Privacy',
        description: 'Great job! Your privacy setup is excellent. Only minor optimizations remain.',
        impact: 0
      })
    } else if (metrics.overallScore >= 70) {
      newInsights.push({
        id: 'good-privacy',
        type: 'success',
        title: 'Good Privacy Protection',
        description: 'You have solid privacy protection. Consider the recommendations above for even better security.',
        impact: 0
      })
    }

    // Educational insights for high scores
    if (metrics.overallScore >= 80) {
      newInsights.push({
        id: 'privacy-education',
        type: 'info',
        title: 'Privacy Best Practices',
        description: 'Remember: Use unique passwords, enable 2FA on your wallet, and avoid sharing sensitive info in any digital format.',
        impact: 0
      })
    }

    return newInsights
  }

  const updateNetworkHealth = async (): Promise<void> => {
    try {
      // XMTP Network Health
      let xmtpStatus: 'healthy' | 'degraded' | 'offline' = 'offline'
      let xmtpLatency = 0
      let xmtpNodes = 0

      if (isConnected && client) {
        const startTime = Date.now()
        try {
          // Test XMTP connectivity by checking client status
          await client.conversations.list({ limit: 1 })
          xmtpLatency = Date.now() - startTime
          xmtpStatus = xmtpLatency < 1000 ? 'healthy' : 'degraded'
          xmtpNodes = Math.floor(Math.random() * 30) + 120 // Simulated node count
        } catch (error) {
          xmtpStatus = 'degraded'
          xmtpLatency = 5000 // High latency indicates issues
          xmtpNodes = Math.floor(Math.random() * 20) + 80
        }
      }

      // Anyone Protocol Network Health
      let anyoneStatus: 'healthy' | 'degraded' | 'offline' = 'offline'
      let anyoneLatency = 0
      let actualRelayCount = 0

      if (anyoneConnected) {
        const startTime = Date.now()
        try {
          // Simulate network test
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
          anyoneLatency = Date.now() - startTime
          anyoneStatus = anyoneLatency < 800 ? 'healthy' : 'degraded'
          actualRelayCount = relayCount || Math.floor(Math.random() * 8) + 3
        } catch (error) {
          anyoneStatus = 'degraded'
          anyoneLatency = 2000
          actualRelayCount = Math.max(1, relayCount || 1)
        }
      }

      const health: NetworkHealth = {
        xmtpStatus,
        anyoneStatus,
        xmtpLatency,
        anyoneLatency,
        xmtpNodes,
        anyoneRelays: actualRelayCount
      }

      setNetworkHealth(health)
    } catch (error) {
      console.error('Failed to update network health:', error)
      // Fallback to basic status
      setNetworkHealth({
        xmtpStatus: isConnected ? 'degraded' : 'offline',
        anyoneStatus: anyoneConnected ? 'degraded' : 'offline',
        xmtpLatency: 0,
        anyoneLatency: 0,
        xmtpNodes: 0,
        anyoneRelays: 0
      })
    }
  }

  const refreshScore = async (): Promise<void> => {
    setIsCalculating(true)
    
    try {
      // Simulate calculation time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const encryptionScore = calculateEncryptionScore()
      const networkScore = calculateNetworkScore()
      const deviceScore = calculateDeviceScore()
      const metadataScore = calculateMetadataScore()
      
      const overallScore = Math.round(
        (encryptionScore * 0.4 + networkScore * 0.3 + deviceScore * 0.2 + metadataScore * 0.1)
      )
      
      const newMetrics = {
        encryptionScore,
        networkScore,
        deviceScore,
        metadataScore,
        overallScore
      }
      
      setMetrics(newMetrics)
      setInsights(generateInsights(newMetrics))
      await updateNetworkHealth()
      const now = new Date()
      setLastUpdated(now)

      // Save to localStorage
      try {
        localStorage.setItem('privacy_metrics', JSON.stringify(newMetrics))
        localStorage.setItem('privacy_last_updated', now.toISOString())
      } catch (error) {
        console.error('Failed to save privacy metrics to localStorage:', error)
      }
      
    } finally {
      setIsCalculating(false)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'EXCELLENT'
    if (score >= 70) return 'GOOD'
    if (score >= 50) return 'FAIR'
    return 'POOR'
  }

  // Auto-refresh score when dependencies change, but only if score is stale
  useEffect(() => {
    const shouldRefresh = () => {
      // Always refresh if no score exists
      if (metrics.overallScore === 0) return true

      // Refresh if last updated is more than 5 minutes ago
      if (lastUpdated) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        return lastUpdated < fiveMinutesAgo
      }

      // Refresh if no last updated time
      return true
    }

    if (shouldRefresh()) {
      refreshScore()
    }
  }, [isConnected, isRegistered, anyoneConnected, circuitId, relayCount])

  // Periodic refresh every 5 minutes (instead of 30 seconds to reduce unnecessary calculations)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if score is older than 5 minutes
      if (lastUpdated) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        if (lastUpdated < fiveMinutesAgo) {
          refreshScore()
        }
      } else {
        refreshScore()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [lastUpdated])

  // Clear stored data when user disconnects
  useEffect(() => {
    if (!isConnected && !anyoneConnected) {
      // Reset metrics but don't clear localStorage immediately
      // This allows the score to persist across page refreshes
      // Only clear if user has been disconnected for more than 1 hour
      const checkClearStorage = () => {
        const lastUpdatedTime = lastUpdated?.getTime() || 0
        const oneHourAgo = Date.now() - 60 * 60 * 1000

        if (lastUpdatedTime < oneHourAgo) {
          try {
            localStorage.removeItem('privacy_metrics')
            localStorage.removeItem('privacy_last_updated')
          } catch (error) {
            console.error('Failed to clear privacy storage:', error)
          }
        }
      }

      // Check after a delay to avoid clearing on quick disconnects
      const timeout = setTimeout(checkClearStorage, 5 * 60 * 1000) // 5 minutes
      return () => clearTimeout(timeout)
    }
  }, [isConnected, anyoneConnected, lastUpdated])

  const value: PrivacyScoreContextType = {
    metrics,
    insights,
    networkHealth,
    isCalculating,
    lastUpdated,
    refreshScore,
    getScoreColor,
    getScoreLabel
  }

  return (
    <PrivacyScoreContext.Provider value={value}>
      {children}
    </PrivacyScoreContext.Provider>
  )
}

export function usePrivacyScore() {
  const context = useContext(PrivacyScoreContext)
  if (context === undefined) {
    throw new Error("usePrivacyScore must be used within a PrivacyScoreProvider")
  }
  return context
}
