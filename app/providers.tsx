"use client"

import * as React from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { XMTPProvider } from "@/hooks/use-xmtp"
import { AnyoneProvider } from "@/hooks/use-anyone"
import { PrivacyScoreProvider } from "@/hooks/use-privacy-score"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AnyoneProvider>
        <XMTPProvider>
          <PrivacyScoreProvider>
            {children}
          </PrivacyScoreProvider>
        </XMTPProvider>
      </AnyoneProvider>
    </ConvexProvider>
  )
}

