import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'png'
    // Usar owner_id como prefijo para que cada negocio tenga su propio logo
    const filename = `${user.id}/logo.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const serviceClient = getServiceClient()

    await serviceClient.storage.from('logos').remove([filename])

    const { error: uploadError } = await serviceClient.storage
      .from('logos')
      .upload(filename, buffer, { contentType: file.type, upsert: true })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = serviceClient.storage.from('logos').getPublicUrl(filename)

    // Actualizar settings del usuario autenticado
    await serviceClient
      .from('settings')
      .update({ logo_url: urlData.publicUrl })
      .eq('owner_id', user.id)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
