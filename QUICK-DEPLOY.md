# QUICK-DEPLOY.md - Comandos Rápidos para Agentes

## Deploy Rápido (Recomendado)
```bash
# 1. Build
npm run build

# 2. Hot deploy
docker cp build/. remix-landing-eclectiquebykmc:/app/build/
docker restart remix-landing-eclectiquebykmc

# 3. Verificar
curl -I http://localhost:3010
```

## Verificación de Sistema
```bash
# Contenedores activos
docker ps | grep eclectique

# Logs recientes
docker logs remix-landing-eclectiquebykmc --tail 10

# Test de URLs
curl -I http://localhost:3010/guides
curl -I http://localhost:3010/about
```

## Gestión de Usuarios Admin
```sql
-- Conectar a DB
docker exec postgres-db psql -U well -d eclectiquebykmc_db

-- Ver usuarios admin
SELECT id, name, email, is_admin FROM users WHERE is_admin = true;

-- Promover a admin
UPDATE users SET is_admin = true WHERE email = 'user@example.com';
```

## Troubleshooting
```bash
# Si no responde (502)
docker start remix-landing-eclectiquebykmc

# Si hay problemas, rebuild completo
docker stop remix-landing-eclectiquebykmc && docker rm remix-landing-eclectiquebykmc
docker build -t docker-stack-remix-landing-eclectiquebykmc:latest .
docker run -d --name remix-landing-eclectiquebykmc \
  --network welltech-shared \
  -p 3010:3000 \
  -e DB_HOST=postgres-db \
  -e DB_PORT=5432 \
  -e DB_USER=well \
  -e DB_PASSWORD=REPLACE_ME \
  -e DB_NAME=eclectiquebykmc_db \
  --restart unless-stopped \
  docker-stack-remix-landing-eclectiquebykmc:latest
```

## URLs Importantes
- **Sitio**: https://eclectiquebykmc.com
- **Admin**: Botones aparecen cuando `contact@eclectiquebykmc.com` está logueado
- **Backend**: http://localhost:8020
