#!/bin/bash

echo "🧪 Test del Sistema de Autenticación - Éclectique by KMC"
echo "=========================================================="

# Definir la URL del backend
BACKEND_URL="http://localhost:8020"
if [ "$1" = "docker" ]; then
  BACKEND_URL="http://eclectique-backend:8020"
fi

echo "📍 Testing en: $BACKEND_URL"

# Test 1: Health Check
echo ""
echo "🩺 Test 1: Health Check"
echo "------------------------"
curl -s "$BACKEND_URL/health" | grep -q "success" && echo "✅ Health check OK" || echo "❌ Health check FAILED"

# Test 2: Registro de usuario
echo ""
echo "👤 Test 2: Registro de Usuario"
echo "-------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@eclectiquebykmc.com",
    "password": "Test123456",
    "nombre": "Usuario",
    "apellido": "Prueba",
    "telefono": "1234567890",
    "genero": "otro"
  }')

echo "Respuesta: $REGISTER_RESPONSE"
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✅ Registro exitoso. Token obtenido."
else
  echo "❌ Registro falló o token no encontrado"
fi

# Test 3: Login
echo ""
echo "🔑 Test 3: Login"
echo "----------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@eclectiquebykmc.com",
    "password": "Test123456"
  }')

echo "Respuesta: $LOGIN_RESPONSE"
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$LOGIN_TOKEN" ]; then
  echo "✅ Login exitoso"
  TOKEN=$LOGIN_TOKEN
else
  echo "❌ Login falló"
fi

# Test 4: Perfil de usuario (autenticado)
echo ""
echo "👤 Test 4: Obtener Perfil (Autenticado)"
echo "---------------------------------------"
if [ -n "$TOKEN" ]; then
  PROFILE_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  echo "Respuesta: $PROFILE_RESPONSE"
  echo "$PROFILE_RESPONSE" | grep -q "success" && echo "✅ Perfil obtenido correctamente" || echo "❌ Error obteniendo perfil"
else
  echo "❌ No hay token para probar perfil"
fi

# Test 5: Login con usuario admin por defecto
echo ""
echo "🔐 Test 5: Login Admin (usuario por defecto)"
echo "--------------------------------------------"
ADMIN_LOGIN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eclectiquebykmc.com",
    "password": "Admin2024!KMC"
  }')

echo "Respuesta: $ADMIN_LOGIN"
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
  echo "✅ Login admin exitoso"
else
  echo "❌ Login admin falló"
fi

# Test 6: Panel admin (requiere permisos admin)
echo ""
echo "🛠️ Test 6: Panel de Administración"
echo "-----------------------------------"
if [ -n "$ADMIN_TOKEN" ]; then
  ADMIN_STATS=$(curl -s -X GET "$BACKEND_URL/api/admin/dashboard/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  echo "Respuesta: $ADMIN_STATS"
  echo "$ADMIN_STATS" | grep -q "totalUsuarios" && echo "✅ Panel admin accesible" || echo "❌ Error en panel admin"
else
  echo "❌ No hay token admin para probar"
fi

echo ""
echo "🎯 Tests completados!"
echo "======================================"