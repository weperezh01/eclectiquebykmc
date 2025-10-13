#!/bin/bash

echo "🚀 Iniciando Backend Éclectique en modo Docker..."
echo "=================================================="

# Crear directorio temporal para el backend
BACKEND_TEMP="/tmp/eclectique-backend"
rm -rf $BACKEND_TEMP
mkdir -p $BACKEND_TEMP

# Copiar archivos del backend al temporal
cp -r backend/* $BACKEND_TEMP/

# Cambiar configuración para Docker
cd $BACKEND_TEMP
sed -i 's/DB_HOST=localhost/DB_HOST=postgres-db/' .env
sed -i 's/NODE_ENV=production/NODE_ENV=development/' .env

echo "📦 Construyendo imagen Docker..."
docker build -t eclectique-backend-local .

echo "🔥 Iniciando contenedor..."
docker run -d \
  --name eclectique-backend-test \
  --network welltech-shared \
  -p 8020:8020 \
  -v eclectique_uploads:/app/uploads \
  eclectique-backend-local

echo "⏳ Esperando que el backend inicie..."
sleep 10

echo "📊 Verificando logs..."
docker logs eclectique-backend-test

echo "🧪 Probando health check..."
curl -s http://localhost:8020/health | head -5

echo "✅ Backend iniciado en puerto 8020"
echo "🔗 Puedes probar: http://localhost:8020"