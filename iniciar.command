#!/bin/bash
cd "$(dirname "$0")"
clear
echo "======================================="
echo "   PLASÉR — Iniciando servidor..."
echo "======================================="
echo ""

# Detectar IP local automáticamente
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="localhost"
  echo "⚠  No se detectó IP de red local. Usando localhost."
else
  echo "📡 IP local detectada: $LOCAL_IP"
fi

APP_URL="http://${LOCAL_IP}:3000"

# Actualizar NEXT_PUBLIC_APP_URL en .env.local
if grep -q "NEXT_PUBLIC_APP_URL=" .env.local; then
  sed -i '' "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=${APP_URL}|" .env.local
else
  echo "NEXT_PUBLIC_APP_URL=${APP_URL}" >> .env.local
fi

echo "🔗 URL de la app: $APP_URL"
echo ""
echo "🚀 Arrancando servidor..."
echo ""
echo "   💻 Ordenador:           http://localhost:3000/dashboard"
echo "   📱 Móvil (misma WiFi):  ${APP_URL}/dashboard"
echo ""
echo "   (Deja esta ventana abierta mientras uses la app)"
echo ""

npx next dev -H 0.0.0.0 -p 3000
