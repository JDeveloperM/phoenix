"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useXMTP } from "@/hooks/use-xmtp"

export function ProfileForm() {
  const { address } = useXMTP()
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)

  const user = useQuery(api.users.getUserByAddress, address ? { address } : "skip")
  const updateProfile = useMutation(api.users.updateProfile)

  useEffect(() => {
    // In a real app, we'd load the existing profile. Assuming user exists, we'd fetch profile via query.
  }, [user?._id])

  const onSave = async () => {
    if (!user?._id) return
    setSaving(true)
    try {
      await updateProfile({ userId: user._id, displayName, avatarUrl, bio })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-gray-900 border border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <Input
          placeholder="Avatar URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <Textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white"
        />
        <Button onClick={onSave} disabled={saving || !user?._id}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  )
}

