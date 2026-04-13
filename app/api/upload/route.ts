import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'png'
    const filename = `logo.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = getServiceClient()

    // Borrar logo anterior si existe
    await supabase.storage.from('logos').remove([filename])

    const { error } = await supabase.storage
      .from('logos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filename)

    // Actualizar settings con la nueva URL
    await supabase
      .from('settings')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', '00000000-0000-0000-0000-000000000001')

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
