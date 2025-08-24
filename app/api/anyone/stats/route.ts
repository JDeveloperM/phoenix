import { NextResponse } from 'next/server'
import { getAnyoneManager } from '@/lib/anyone-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getAnyoneManager().getNetworkStats()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Failed to fetch stats' }, { status: 500 })
  }
}

