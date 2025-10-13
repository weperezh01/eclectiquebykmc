#!/bin/bash

echo "Testing Éclectique API connectivity..."
echo

echo "1. Testing backend health endpoint through Caddy proxy:"
curl -s -k https://eclectiquebykmc.com/api/health | jq . || echo "Health endpoint failed"
echo

echo "2. Testing auth/me endpoint (should return 401 without token):"
response=$(curl -s -k https://eclectiquebykmc.com/api/auth/me)
echo $response | jq . || echo "API response: $response"
echo

echo "3. Testing direct backend connectivity (internal Docker network):"
docker exec eclectique-backend curl -s http://localhost:8020/health | jq . || echo "Direct backend failed"
echo

echo "4. Testing Caddy routing configuration:"
echo "Frontend URL: https://eclectiquebykmc.com"
echo "API Proxy: https://eclectiquebykmc.com/api/* -> eclectique-backend:8020"
echo

echo "✅ Test completed!"