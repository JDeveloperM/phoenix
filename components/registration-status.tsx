"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useXMTP } from "@/hooks/use-xmtp"

export function RegistrationStatus() {
  const { client, isRegistered, registerDevice } = useXMTP()

  if (!client) return null

  return (
    <div className="flex items-center space-x-2 text-xs">
      {isRegistered ? (
        <Badge variant="outline" className="border-green-600 text-green-400">Registered</Badge>
      ) : (
        <Button size="xs" variant="secondary" onClick={registerDevice}>Register</Button>
      )}
    </div>
  )
}

