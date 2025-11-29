# Guía de Prueba - Funcionalidad de Upload

Esta guía te ayudará a probar que todas las imágenes se suban correctamente y no se pierdan en futuros deploys.

## ✅ Pruebas a Realizar

### 1. Prueba de Upload de Cover Image (Guide)

1. **Ir a:** https://eclectiquebykmc.com/admin/guides
2. **Crear nuevo guide** o **editar existente**
3. **En la sección "Cover Image":**
   - Usar "Upload from Device" 
   - Seleccionar una imagen desde tu computadora
   - Verificar que se muestre preview de la imagen
   - Guardar el guide
4. **Verificar:**
   - La imagen se muestra en la lista de guides
   - La imagen es accesible en: `https://eclectiquebykmc.com/images/uploads/profile-{timestamp}.{ext}`

### 2. Prueba de Upload de Item Images (En desarrollo)

📝 **NOTA:** El formulario actual solo permite URLs manuales para las imágenes de items. La funcionalidad de upload para items está configurada en el backend pero falta implementar la UI.

**Endpoint disponible:** `/api/upload-guide-item`
- Acepta: `POST` con `FormData`
- Campo: `image` 
- Formatos: JPEG, PNG, WebP
- Límite: 10MB
- Guarda en: `/images/uploads/guide-item-{timestamp}-{filename}.{ext}`

### 3. Verificar Persistencia Después de Deploy

1. **Antes del deploy:**
   ```bash
   ./backup-uploads.sh
   ```

2. **Hacer deploy:**
   ```bash
   npm run build
   docker cp build/. remix-landing-eclectiquebykmc:/app/build/
   docker restart remix-landing-eclectiquebykmc
   ```

3. **Verificar que las imágenes persistan:**
   - Visitar guides creados anteriormente
   - Verificar que las imágenes sigan siendo accesibles
   - Si faltan imágenes, restaurar: `./restore-uploads.sh {backup_file}`

## 🔧 Ubicación de Archivos Subidos

**Todas las imágenes se guardan en:**
- **Volumen Docker:** `remix-uploads-volume`
- **Ruta en contenedor:** `/app/public/images/uploads/`  
- **URL pública:** `https://eclectiquebykmc.com/images/uploads/{filename}`

**Formatos de nombres:**
- Cover images: `profile-{timestamp}.{ext}`
- Guide items: `guide-item-{timestamp}-{filename}.{ext}`  
- Cover específico: `cover-{timestamp}-{filename}.{ext}`

## 🚨 Qué Hacer Si Se Pierden Imágenes

### Diagnóstico Rápido
```bash
# Verificar volumen montado
docker inspect remix-landing-eclectiquebykmc | jq '.[0].Mounts'

# Verificar archivos en volumen  
docker exec remix-landing-eclectiquebykmc ls -la /app/public/images/uploads/

# Ver backups disponibles
ls -la uploads_backup/uploads_backup_*.tar.gz
```

### Restauración
```bash
# Restaurar desde backup más reciente
./restore-uploads.sh uploads_backup_YYYYMMDD_HHMMSS.tar.gz

# Verificar restauración
docker exec remix-landing-eclectiquebykmc ls -la /app/public/images/uploads/
```

## 📋 Lista de Verificación Post-Deploy

- [ ] Volumen `remix-uploads-volume` montado en `/app/public/images/uploads`
- [ ] Archivos subidos anteriormente siguen accesibles
- [ ] Nuevos uploads funcionan correctamente
- [ ] Backup automático funciona: `./backup-uploads.sh`
- [ ] URLs de imágenes devuelven HTTP 200

## ⚡ Prueba Rápida de Funcionalidad

```bash
# Crear backup
./backup-uploads.sh

# Probar que archivos existen
curl -I https://eclectiquebykmc.com/images/uploads/profile-1764186671999.jpeg

# Verificar mount del volumen
docker exec remix-landing-eclectiquebykmc mount | grep uploads
```

**Resultado esperado:**
- Backup creado exitosamente
- Imagen devuelve `HTTP/2 200`
- Volumen montado como: `remix-uploads-volume on /app/public/images/uploads`

## 🎯 Estado Actual

✅ **Volumen persistente configurado**
✅ **Todos los endpoints usan ruta persistente**  
✅ **Cover images de guides funcionan**
✅ **Sistema de backup/restore disponible**
✅ **Documentación completa**

⚠️ **Pendiente:** UI para upload de imágenes de items (endpoint backend listo)

---

**¡Las imágenes ya no se perderán en futuros deploys!** 🎉