import { NextRequest, NextResponse } from 'next/server'

// Apple calls this endpoint when there are errors with pass updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.error('[PassKit Log]', JSON.stringify(body))
  } catch {
    // ignore malformed body
  }
  return new NextResponse(null, { status: 200 })
}
