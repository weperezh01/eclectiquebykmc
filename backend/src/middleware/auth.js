const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

// Middleware para verificar autenticación
async function authenticate(req, res, next) {
  try {
    // Intentar obtener token desde cookie primero, luego desde header (backward compatibility)
    let token = req.cookies?.auth_token;
    
    if (!token) {
      // Fallback a Authorization header para compatibilidad
      const authHeader = req.headers.authorization;
      token = extractTokenFromHeader(authHeader);
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }
    
    // Verificar y decodificar token
    const decoded = verifyToken(token);
    
    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado o inactivo' 
      });
    }
    
    // Agregar usuario a la request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    let statusCode = 401;
    let message = 'Token inválido';
    
    if (error.message === 'Token expirado') {
      statusCode = 401;
      message = 'Token expirado, por favor inicia sesión nuevamente';
    } else if (error.message === 'Token inválido') {
      statusCode = 401;
      message = 'Token inválido';
    }
    
    return res.status(statusCode).json({ 
      success: false, 
      message 
    });
  }
}

// Middleware para verificar rol de administrador
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Autenticación requerida' 
    });
  }
  
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Se requieren permisos de administrador' 
    });
  }
  
  next();
}

// Middleware opcional - no falla si no hay token
async function optionalAuth(req, res, next) {
  try {
    // Intentar obtener token desde cookie primero, luego desde header (backward compatibility)
    let token = req.cookies?.auth_token;
    
    if (!token) {
      // Fallback a Authorization header para compatibilidad
      const authHeader = req.headers.authorization;
      token = extractTokenFromHeader(authHeader);
    }
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignorar errores en autenticación opcional
    next();
  }
}

module.exports = {
  authenticate,
  requireAdmin,
  optionalAuth
};