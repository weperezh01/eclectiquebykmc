# DEPLOYMENT.md - Guía para Agentes Futuros

## Resumen del Proyecto

**Éclectique by KMC** es una landing page de marketing de afiliados en español para moda y estilo de vida. Utiliza Remix v2 con autenticación real y funcionalidad de administrador.

## Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Remix v2 con Vite, TypeScript, TailwindCSS
- **Backend**: FastAPI en puerto 8020 (`eclectique-backend`)
- **Base de Datos**: PostgreSQL (`eclectiquebykmc_db`)
- **Contenedorización**: Docker con red `welltech-shared`
- **Proxy**: Caddy (puerto 80/443 → puerto 3010)

### Servicios en Ejecución
```bash
# Verificar servicios activos
docker ps | grep eclectique

# Deberías ver:
# remix-landing-eclectiquebykmc (puerto 3010:3000)
# eclectique-backend (puerto 8020:8020)
```

## Sistema de Usuarios y Autenticación

### Estructura de Base de Datos

**Tabla `users` en base de datos `eclectiquebykmc_db`:**
```sql
-- Conectar a la base de datos
docker exec postgres-db psql -U well -d eclectiquebykmc_db

-- Estructura de usuarios
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' ORDER BY ordinal_position;

-- Campos principales:
-- id (integer) - Primary key
-- name (varchar) - Nombre del usuario
-- email (varchar) - Email único
-- password_hash (varchar) - Hash de contraseña
-- is_active (boolean) - Usuario activo
-- is_admin (boolean) - Permisos de administrador
-- created_at (timestamp) - Fecha de creación
-- avatar_url (text) - URL del avatar
```

### Usuario Administrador Actual
```sql
-- Verificar usuario admin
SELECT id, name, email, is_admin FROM users WHERE is_admin = true;

-- Usuario configurado:
-- email: contact@eclectiquebykmc.com
-- name: karina
-- is_admin: true
```

### Flujo de Autenticación

1. **Frontend** → Envía credenciales a `/api/auth/login`
2. **Backend** (`eclectique-backend:8020`) → Valida credenciales
3. **JWT/Cookies** → Establece sesión autenticada
4. **Verificación** → Endpoint `/api/auth/me` retorna datos del usuario
5. **Admin Check** → Campo `is_admin` determina permisos

### Endpoints de Autenticación
```
POST /api/auth/login    - Iniciar sesión
POST /api/auth/register - Registrar usuario
GET  /api/auth/me      - Obtener usuario actual
POST /api/auth/logout  - Cerrar sesión
```

## Funcionalidad de Administrador Implementada

### Páginas con Botones Admin

#### 1. `/guides` → `/admin/guides`
**Archivo**: `app/routes/guides._index.tsx`
**Funcionalidad**: Gestión de guías de estilo
**Botón**: "Manage Guides" (ícono de configuración)

#### 2. `/about` → `/admin/about`  
**Archivo**: `app/routes/about._index.tsx`
**Funcionalidad**: Edición de contenido "About KMC"
**Botón**: "Edit About" (ícono de edición)

### Implementación del Sistema Admin

**Patrón usado en ambas páginas:**

1. **Loader con Verificación**:
```typescript
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // ... lógica específica de la página ...
  
  // Check if user is authenticated and is admin
  let isAdmin = false;
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');

    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const userData = await response.json();
      isAdmin = userData?.is_admin === true;
    }
  } catch (error) {
    // If auth fails, isAdmin remains false
    console.log('Auth check failed:', error);
  }
  
  return json({ ...otherData, isAdmin });
};
```

2. **Botón Condicional en UI**:
```typescript
export default function PageComponent() {
  const { isAdmin, ...otherData } = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Page Title</h1>
        {/* Show admin button only if user is authenticated as admin */}
        {isAdmin && (
          <a
            href="/admin/target-page"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" /* icon SVG */>
            Button Text
          </a>
        )}
      </div>
      {/* Rest of page content */}
    </main>
  );
}
```

## Proceso de Deployment Rápido

### Método 1: Hot Deploy (Recomendado para Desarrollo)
```bash
# 1. Hacer cambios en el código
# 2. Build local
npm run build

# 3. Copiar archivos al contenedor en ejecución
docker cp build/. remix-landing-eclectiquebykmc:/app/build/

# 4. Reiniciar contenedor
docker restart remix-landing-eclectiquebykmc

# 5. Verificar
curl -I http://localhost:3010
```

### Método 2: Rebuild Completo (Para Cambios Mayores)
```bash
# 1. Hacer cambios en el código
# 2. Parar contenedor actual
docker stop remix-landing-eclectiquebykmc
docker rm remix-landing-eclectiquebykmc

# 3. Rebuild imagen
docker build -t docker-stack-remix-landing-eclectiquebykmc:latest .

# 4. Crear nuevo contenedor
docker run -d --name remix-landing-eclectiquebykmc \
  --network welltech-shared \
  -p 3010:3000 \
  --restart unless-stopped \
  docker-stack-remix-landing-eclectiquebykmc:latest

# 5. Verificar
docker ps | grep eclectique
```

### Método 3: Script de Deploy Automático
```bash
# Usar el script existente del sistema
../docker-stack/deploy-eclectique.sh
```

## Verificación de Deployment

### Checks Esenciales
```bash
# 1. Contenedores ejecutándose
docker ps | grep eclectique

# 2. Logs sin errores
docker logs remix-landing-eclectiquebykmc --tail 10

# 3. Sitio responde
curl -I http://localhost:3010
curl -I http://localhost:3010/guides
curl -I http://localhost:3010/about

# 4. Backend disponible
curl -I http://localhost:8020/api/auth/me
```

### URLs de Producción
- **Sitio Principal**: https://eclectiquebykmc.com
- **Guides**: https://eclectiquebykmc.com/guides
- **About**: https://eclectiquebykmc.com/about
- **Admin Guides**: https://eclectiquebykmc.com/admin/guides
- **Admin About**: https://eclectiquebykmc.com/admin/about

## Gestión de Usuarios Admin

### Promover Usuario a Admin
```sql
-- Conectar a la base de datos
docker exec postgres-db psql -U well -d eclectiquebykmc_db

-- Promover usuario existente
UPDATE users SET is_admin = true WHERE email = 'email@example.com';

-- Verificar cambio
SELECT id, name, email, is_admin FROM users WHERE email = 'email@example.com';
```

### Crear Nuevo Usuario Admin
```sql
-- Insertar nuevo usuario (requiere hash de contraseña del backend)
INSERT INTO users (name, email, password_hash, is_active, is_admin, created_at)
VALUES ('Admin Name', 'admin@example.com', 'hashed_password', true, true, NOW());
```

## Estructura de Archivos Clave

```
app/
├── routes/
│   ├── guides._index.tsx        # Página guides con botón admin
│   ├── about._index.tsx         # Página about con botón admin
│   ├── admin.guides._index.tsx  # Panel admin de guides
│   ├── admin.about._index.tsx   # Panel admin de about
│   └── api.auth.me.tsx         # Proxy de autenticación
├── lib/
│   └── db.ts                   # Conexión a PostgreSQL
└── content/
    └── links.ts                # Contenido estático del sitio
```

## Patrones de Código Establecidos

### Para Añadir Botón Admin a Nueva Página:

1. **Modificar el loader** para incluir verificación de admin
2. **Añadir `isAdmin` al tipo de retorno** del loader
3. **Usar `isAdmin` en el componente** para mostrar/ocultar botón
4. **Seguir el patrón de UI** establecido (mismo estilo de botón)
5. **Crear la página admin correspondiente** en `/admin/[page]`

### Ejemplo de Nueva Implementación:
```typescript
// En app/routes/new-page._index.tsx
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // ... lógica específica ...
  
  // AÑADIR: Verificación admin (copiar de guides o about)
  let isAdmin = false;
  // ... código de verificación ...
  
  return json({ ...pageData, isAdmin });
};

export default function NewPage() {
  const { isAdmin, ...pageData } = useLoaderData<typeof loader>();
  
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Page Title</h1>
        {isAdmin && (
          <a href="/admin/new-page" className="admin-button-styles">
            <svg><!-- icon --></svg>
            Admin Action
          </a>
        )}
      </div>
      {/* contenido */}
    </main>
  );
}
```

## Troubleshooting Común

### Error 502 - Bad Gateway
```bash
# Verificar contenedores
docker ps | grep eclectique

# Si no hay contenedor frontend:
docker start remix-landing-eclectiquebykmc

# Si el contenedor está corrupto:
# Usar Método 2 (Rebuild Completo)
```

### Autenticación No Funciona
```bash
# Verificar backend
curl -I http://localhost:8020/api/auth/me

# Verificar base de datos
docker exec postgres-db psql -U well -d eclectiquebykmc_db -c "SELECT * FROM users WHERE is_admin = true;"
```

### Cambios No Se Ven
```bash
# Limpiar caché del navegador
# O verificar que el build se copió correctamente:
docker exec remix-landing-eclectiquebykmc ls -la /app/build/

# Si no hay archivos recientes, usar Hot Deploy (Método 1)
```

## Contexto del Proyecto

### Última Sesión de Trabajo (Octubre 2025)
- ✅ Implementado sistema de autenticación real (sustituyó localStorage)
- ✅ Configurado usuario admin: `contact@eclectiquebykmc.com`
- ✅ Añadido botón admin en `/guides` → `/admin/guides`
- ✅ Añadido botón admin en `/about` → `/admin/about`
- ✅ Sistema de deployment rápido con hot-reload
- ✅ Documentación completa para futuros agentes

### Arquitectura de Red
- **Red Docker**: `welltech-shared`
- **Puerto Frontend**: 3010 (externo) → 3000 (interno)
- **Puerto Backend**: 8020 (externo y interno)
- **Proxy Caddy**: Rutea `eclectiquebykmc.com` → `localhost:3010`

El sistema está completamente funcional y listo para expansiones futuras siguiendo los patrones establecidos.