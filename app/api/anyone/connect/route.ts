import { NextResponse } from 'next/server'
import { getAnyoneManager } from '@/lib/anyone-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const res = await getAnyoneManager().connect()
    return NextResponse.json({ ok: true, ...res })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Failed to connect' }, { status: 500 })
  }
}

