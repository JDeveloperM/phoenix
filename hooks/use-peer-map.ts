"use client"

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function usePeerMap(inboxIds: string[]) {
  const data = useQuery((api as any).users.getProfilesForInboxIds, inboxIds.length ? { inboxIds } : "skip") as
    | Record<string, { displayName?: string; avatarUrl?: string }>
    | undefined
  return useMemo(() => data || {}, [data])
}

