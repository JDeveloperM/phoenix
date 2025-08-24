"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useXMTP } from "@/hooks/use-xmtp"
import { ManageDevices } from "@/components/manage-devices"

export default function SettingsPage() {
  const { disconnect } = useXMTP()
  const [privacyEnabled, setPrivacyEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Privacy Protection</div>
                <div className="text-sm text-gray-400">Route traffic via decentralized relay (demo toggle)</div>
              </div>
              <Switch checked={privacyEnabled} onCheckedChange={setPrivacyEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-sm text-gray-400">Enable desktop notifications (demo)</div>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
            <div>
              <div className="font-medium mb-2">Manage XMTP Devices</div>
              <ManageDevices />
            </div>
            <div className="flex justify-end">
              <Button variant="destructive" onClick={disconnect}>Disconnect</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

