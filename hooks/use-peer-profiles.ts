"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

// Map a list of peer inboxIds to their user profiles by looking up users by inboxId index.
export function usePeerProfiles(inboxIds: string[]) {
  const [map, setMap] = useState<Record<string, { displayName?: string; avatarUrl?: string }>>({})
  const users = useQuery(api.users.getUserByAddress, "skip") // placeholder, we'll fetch via action soon
  // For simplicity in this step, we'll return an empty map; ChatSidebar will still work with fallback.
  useEffect(() => {
    setMap({})
  }, [inboxIds.join(",")])
  return map
}

