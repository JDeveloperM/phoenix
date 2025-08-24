import { NextResponse } from 'next/server'
import { getAnyoneManager } from '@/lib/anyone-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await getAnyoneManager().disconnect()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Failed to disconnect' }, { status: 500 })
  }
}

