# Usar redis Alpine como base (ya disponible localmente)
FROM redis:7-alpine

# Instalar Node.js y npm
RUN apk add --no-cache nodejs npm python3 make g++

# Crear usuario para la aplicación
RUN addgroup -g 1001 -S nodejs && \
    adduser -S eclectique -u 1001 -G nodejs

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads/avatars && \
    chown -R eclectique:nodejs /app

# Cambiar a usuario no-root
USER eclectique

# Exponer puerto
EXPOSE 8020

# Comando por defecto
CMD ["npm", "start"]