const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/database');
const User = require('./models/User');
const Product = require('./models/Product');

// Importar rutas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const productsRoutes = require('./routes/products');

// Crear aplicación Express
const app = express();

// Configuración de puerto y host
const PORT = process.env.PORT || 8020;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Deshabilitado para desarrollo
}));

// Compresión GZIP
app.use(compression());

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 1000 requests por ventana de tiempo por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP. Intenta nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles o Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5177',
      'http://localhost:3000',
      'http://localhost:3010', // Añadir puerto del frontend
      'https://eclectiquebykmc.com',
      'https://www.eclectiquebykmc.com'
    ];
    
    // En desarrollo, permitir cualquier localhost
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing (needed for authentication)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Servir archivos estáticos (avatares)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Éclectique Backend API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Éclectique by KMC - Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      health: '/health',
      uploads: '/uploads'
    },
    documentation: {
      auth: {
        POST: ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'],
        GET: ['/api/auth/me'],
        PUT: ['/api/auth/me', '/api/auth/change-password']
      },
      admin: {
        GET: ['/api/admin/dashboard/stats', '/api/admin/users', '/api/admin/users/:userId'],
        PUT: ['/api/admin/users/:userId/status']
      }
    }
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    requestedPath: req.originalUrl,
    method: req.method
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  // Error de CORS
  if (error.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS: Origen no permitido'
    });
  }
  
  // Error de JSON malformado
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON malformado en el cuerpo de la solicitud'
    });
  }
  
  // Error genérico
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Función para iniciar el servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Éclectique Backend Server...');
    
    // Probar conexión a base de datos
    console.log('📊 Conectando a PostgreSQL...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    
    // Inicializar tablas
    console.log('🗃️ Inicializando tablas...');
    await User.initTable();
    await Product.initTable();
    
    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log('✅ Servidor iniciado exitosamente');
      console.log(`📍 URL: http://${HOST}:${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS habilitado para: ${corsOptions.origin}`);
      console.log('📊 Endpoints disponibles:');
      console.log('   - GET  /           (Información de la API)');
      console.log('   - GET  /health     (Health check)');
      console.log('   - POST /api/auth/* (Autenticación)');
      console.log('   - GET  /api/admin/* (Administración)');
      console.log('   - GET  /uploads/*  (Archivos estáticos)');
      console.log('🎯 Listo para recibir solicitudes!');
    });
    
  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido. Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido. Cerrando servidor gracefully...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;
