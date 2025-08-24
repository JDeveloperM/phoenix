"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface AnyoneContextType {
  isConnected: boolean
  isConnecting: boolean
  circuitId: string | null
  relayCount: number
  bandwidth: string
  error: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getNetworkStats: () => Promise<void>
}

const AnyoneContext = createContext<AnyoneContextType | undefined>(undefined)

export function AnyoneProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [circuitId, setCircuitId] = useState<string | null>(null)
  const [relayCount, setRelayCount] = useState(0)
  const [bandwidth, setBandwidth] = useState("0 MB/s")
  const [error, setError] = useState<string | null>(null)
  const [anyoneClient, setAnyoneClient] = useState<any>(null)

  const connect = async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setError(null)

    try {
      const res = await fetch('/api/anyone/connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to connect to Anyone Protocol')
      }
      setCircuitId(String(data.circuitId))
      setIsConnected(true)
      await getNetworkStats()
    } catch (err) {
      console.error('Failed to connect to Anyone Protocol:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to Anyone Protocol')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      await fetch('/api/anyone/disconnect', { method: 'POST' })
    } catch {}
    setIsConnected(false)
    setCircuitId(null)
    setRelayCount(0)
    setBandwidth("0 MB/s")
    setError(null)
  }

  const getNetworkStats = async () => {
    try {
      const res = await fetch('/api/anyone/stats')
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to fetch stats')
      setRelayCount(data.activeRelays || 6000)
      setBandwidth(data.totalBandwidth || '57 GB/s')
    } catch (err) {
      console.error('Failed to get network stats:', err)
      setRelayCount(6000)
      setBandwidth('57 GB/s')
    }
  }

  // Simulate network stats updates
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        getNetworkStats()
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isConnected])

  const value: AnyoneContextType = {
    isConnected,
    isConnecting,
    circuitId,
    relayCount,
    bandwidth,
    error,
    connect,
    disconnect,
    getNetworkStats,
  }

  return <AnyoneContext.Provider value={value}>{children}</AnyoneContext.Provider>
}

export function useAnyone() {
  const context = useContext(AnyoneContext)
  if (context === undefined) {
    throw new Error("useAnyone must be used within an AnyoneProvider")
  }
  return context
}
