import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fondo oscuro
  ctx.fillStyle = '#0D0B09'
  ctx.fillRect(0, 0, size, size)

  // Círculo ámbar suave
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(200, 135, 58, 0.15)'
  ctx.fill()

  // Letra P centrada
  ctx.fillStyle = '#C8873A'
  ctx.font = `bold ${size * 0.42}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('P', cx, cy + size * 0.02)

  const buffer = canvas.toBuffer('image/png')
  writeFileSync(`public/${filename}`, buffer)
  console.log(`✓ ${filename} (${size}x${size})`)
}

generateIcon(192, 'icon-192.png')
generateIcon(512, 'icon-512.png')
generateIcon(180, 'apple-icon-180.png')
generateIcon(152, 'apple-icon-152.png')
generateIcon(180, 'apple-icon.png')

console.log('Iconos generados.')
