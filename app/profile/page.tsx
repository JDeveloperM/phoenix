"use client"

import { useState, useEffect } from "react"
import { useXMTP } from "@/hooks/use-xmtp"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useMutation, useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { address, ensName } = useXMTP()
  const [displayName, setDisplayName] = useState(ensName || "")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bio, setBio] = useState("")

  const updateProfile = useMutation(api.users.updateProfile)
  const generateUploadUrl = useAction(api.uploads.generateUploadUrl)
  const user = useQuery(api.users.getUserByAddress, address ? { address } : "skip")
  const existingProfile = useQuery(api.users.getProfileByAddress, address ? { address } : "skip")

  useEffect(() => {
    setDisplayName(ensName || existingProfile?.displayName || "")
    setAvatarUrl(existingProfile?.avatarUrl || "")
    setBio(existingProfile?.bio || "")
  }, [ensName, existingProfile])

  const handleSave = async () => {
    if (!user) return
    await updateProfile({
      userId: user._id,
      displayName: displayName || undefined,
      avatarUrl: avatarUrl || undefined,
      bio: bio || undefined,
    })
    // Optionally toast
    alert("Profile saved")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-6">
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="avatar" />
                ) : null}
                <AvatarFallback>{(displayName || address || "?").slice(2,4)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-gray-400 text-sm">{address}</div>
                {ensName && <div className="text-gray-300">{ensName}</div>}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="text-sm text-gray-400">Display name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-gray-900 border-gray-700" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-gray-400">Avatar</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="bg-gray-900 border-gray-700"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const url = await generateUploadUrl()
                        const res = await fetch(url, {
                          method: "POST",
                          headers: { "Content-Type": file.type },
                          body: file,
                        })
                        const { storageId } = await res.json()
                        // Save profile immediately with storageId
                        if (user) {
                          await updateProfile({ userId: user._id, avatarStorageId: storageId })
                          toast({ title: "Avatar uploaded", description: "Your avatar image was uploaded." })
                        }
                      } catch (err) {
                        console.error(err)
                        toast({ title: "Upload failed", description: "Could not upload avatar.", variant: "destructive" })
                      }
                    }}
                    className="block text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Bio</label>
                <Input value={bio} onChange={(e) => setBio(e.target.value)} className="bg-gray-900 border-gray-700" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => {
                  setDisplayName(existingProfile?.displayName || ensName || "")
                  setAvatarUrl(existingProfile?.avatarUrl || "")
                  setBio(existingProfile?.bio || "")
                }}>Reset</Button>
                <Button onClick={async () => {
                  await handleSave()
                  toast({ title: "Profile saved", description: "Your profile has been updated." })
                }}>Save</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

