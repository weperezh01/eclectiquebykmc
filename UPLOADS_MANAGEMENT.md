# Gestión de Imágenes Subidas

Este documento explica cómo recuperar y proteger las imágenes subidas en Éclectique by KMC.

## Problema Resuelto

Las imágenes subidas se guardaban dentro del contenedor Docker y se perdían durante los redeploys. Ahora están en un volumen persistente.

## Configuración Actual

### Volumen Persistente
- **Volumen:** `remix-uploads-volume`
- **Ruta en contenedor:** `/app/public/images/uploads`
- **Configuración:** `docker-compose.override.yml`

```yaml
volumes:
  - remix-uploads-volume:/app/public/images/uploads

volumes:
  remix-uploads-volume:
    external: true
```

### Endpoints de Upload Unificados

**Todos los endpoints ahora guardan en `/images/uploads/` (volumen persistente):**

1. **`/admin/upload`** - Cover images de guides
   - Formato: `profile-{timestamp}.{ext}`
   - Usado en: Cover image del modal de guide

2. **`/api/upload-guide-item`** - Imágenes de items de guides
   - Formato: `guide-item-{timestamp}-{filename}.{ext}`
   - Usado en: Subida de imágenes de productos en items

3. **`/api/upload-cover`** - Cover images alternativo
   - Formato: `cover-{timestamp}-{filename}.{ext}`
   - Usado en: Upload de covers específico

4. **`/api/upload`** - Upload general
   - Formato: `profile-{timestamp}.{ext}`
   - Usado en: Uploads generales del sistema

### Scripts de Backup/Restore

#### Crear Backup
```bash
./backup-uploads.sh
```
- Crea backup comprimido con timestamp
- Mantiene últimos 10 backups automáticamente
- Ubicación: `uploads_backup/uploads_backup_YYYYMMDD_HHMMSS.tar.gz`

#### Restaurar Backup
```bash
./restore-uploads.sh uploads_backup_20251128_021139.tar.gz
```
- Restaura imágenes desde backup específico
- Limpia volumen antes de restaurar

## Imágenes Recuperadas

### Amazon Favorites (guide_id = 18)
- Anne Klein Black & Cold Watch → `profile-1764222043441.jpg`
- Long Sleeve Bodysuits → `profile-1764222073857.jpeg`  
- Nude Faux Suede Booties → `profile-1764222091941.jpg`
- Taupe Top Handle/Crossbody Bag → `profile-1764222139111.jpg`
- Wide Leg Pants → `profile-1764222171117.jpg`
- Adjustable Thin Belt → `profile-1764220576628.jpeg`

### Easy Fall Look (guide_id = 19)  
- Pre-owned LV Speedy 25 → `profile-1761880512961.jpg`
- Cushionaire Women's Balance Sneaker → `profile-1761880968355.jpg`
- Otros productos mantienen placeholders

### Imágenes Placeholder (desde /images/guides/)
**20 imágenes genéricas recuperadas:**
- blazer.webp, blouse.webp, boots.webp, cardigan.webp, denim-jacket.webp
- dress.webp, floral-dress.webp, heels.webp, hoodie.webp, jeans.webp
- joggers.webp, leggings.webp, necklace.webp, purse.webp, sandals.webp
- scarf.webp, slippers.webp, sneakers.webp, tote.webp

**Total de archivos en volumen persistente:** 31 archivos
- **Imágenes reales:** 11 archivos
- **Placeholders:** 20 archivos WebP

## Mejores Prácticas

### Para Futuros Deploys

1. **ANTES del deploy:**
   ```bash
   ./backup-uploads.sh
   ```

2. **DESPUÉS del deploy:**
   ```bash
   # Verificar que el volumen está montado
   docker exec remix-landing-eclectiquebykmc ls -la /app/public/images/uploads/
   
   # Si las imágenes no están, restaurar último backup
   ./restore-uploads.sh uploads_backup_YYYYMMDD_HHMMSS.tar.gz
   ```

### Para Nuevas Imágenes

1. **Subida normal:** Usar la interfaz `/admin/guides` → funciona automáticamente
2. **Backup manual:** Ejecutar `./backup-uploads.sh` después de subir imágenes importantes
3. **Verificación:** Comprobar que la imagen sea accesible: `https://eclectiquebykmc.com/images/uploads/filename.ext`

## Troubleshooting

### Las imágenes no se muestran
1. Verificar que el volumen esté montado:
   ```bash
   docker inspect remix-landing-eclectiquebykmc | jq '.[0].Mounts'
   ```

2. Verificar archivos en volumen:
   ```bash
   docker exec remix-landing-eclectiquebykmc ls -la /app/public/images/uploads/
   ```

3. Restaurar desde backup:
   ```bash
   ./restore-uploads.sh uploads_backup_YYYYMMDD_HHMMSS.tar.gz
   ```

### Recrear volumen desde cero
```bash
# Detener contenedor
docker stop remix-landing-eclectiquebykmc

# Eliminar volumen existente
docker volume rm remix-uploads-volume

# Recrear volumen
docker volume create remix-uploads-volume

# Restaurar desde backup
./restore-uploads.sh uploads_backup_YYYYMMDD_HHMMSS.tar.gz

# Reiniciar contenedor
docker compose -f ../docker-stack/docker-compose.yaml -f ../docker-stack/docker-compose.override.yml up -d remix-landing-eclectiquebykmc
```

## Estado Actual

✅ **Volumen persistente configurado**
✅ **Imágenes existentes recuperadas**  
✅ **Scripts de backup/restore disponibles**
✅ **Amazon Favorites con imágenes reales**
✅ **Easy Fall Look parcialmente restaurado**
✅ **Documentación completa**

Las imágenes ahora persistirán entre deploys y están protegidas con backups automáticos.