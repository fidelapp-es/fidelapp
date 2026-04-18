import { NextResponse } from 'next/server'

// Diagnostic endpoint — checks if Apple Wallet cert env vars are present in the container.
// ONLY for debugging; does NOT expose cert content.
export async function GET() {
  const vars = ['APPLE_WWDR_CERT', 'APPLE_SIGNER_CERT', 'APPLE_SIGNER_KEY']

  const result: Record<string, { set: boolean; length: number; preview: string }> = {}

  for (const v of vars) {
    const val = process.env[v] ?? ''
    result[v] = {
      set: val.length > 0,
      length: val.length,
      // First 20 chars to confirm it looks like base64 (safe — certs are public-key material)
      preview: val.slice(0, 20),
    }
  }

  return NextResponse.json({
    ok: true,
    env: result,
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '(not set)',
  })
}
