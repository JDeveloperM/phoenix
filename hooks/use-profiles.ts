"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export interface Profile {
  displayName?: string
  avatarUrl?: string
  bio?: string
}

// Look up a profile directly by wallet address
export function useProfileByAddress(address?: string | null) {
  const profile = useQuery((api as any).users.getProfileByAddress, address ? { address } : "skip")
  return profile as any as Profile | null
}

// Look up a profile by inboxId by first resolving the user, then fetching their profile
export function useProfileByInbox(inboxId?: string | null) {
  const user = useQuery((api as any).users.getUserByInboxId, inboxId ? { inboxId } : "skip")
  const profile = useQuery((api as any).users.getProfileByAddress, user ? { address: user.address } : "skip")
  return profile as any as Profile | null
}

// Future: we could add a query to fetch by inboxId via users.by_inbox index

