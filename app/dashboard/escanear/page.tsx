import EscanearQR from './EscanearQR'

export default function EscanearPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Escanear QR</h1>
        <p className="text-white/40 mt-1 text-sm">Escanea el QR del cliente para registrar su visita y sumar puntos</p>
      </div>
      <div className="max-w-md mx-auto">
        <EscanearQR />
      </div>
    </div>
  )
}
