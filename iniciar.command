#!/bin/bash
cd "$(dirname "$0")"
clear
echo "======================================="
echo "   PLASÉR — Iniciando servidor..."
echo "======================================="
echo ""
echo "⚙  Construyendo la app (espera ~2 min)..."
echo ""

npm run build

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Error en el build. Revisa los mensajes anteriores."
  read -p "Pulsa Enter para cerrar..."
  exit 1
fi

echo ""
echo "✅ Build completado. Arrancando servidor..."
echo ""
echo "   Abre en el navegador: http://localhost:3000/dashboard"
echo "   Móvil (misma WiFi):   http://192.168.1.133:3000/dashboard"
echo ""
echo "   (Deja esta ventana abierta mientras uses la app)"
echo ""

npx next start -H 0.0.0.0 -p 3000
