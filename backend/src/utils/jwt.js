const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'eclectique_jwt_super_secret_key_2024_kmc_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generar JWT token
function generateToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'eclectique-backend',
      audience: 'eclectique-frontend'
    });
  } catch (error) {
    console.error('Error generando JWT:', error);
    throw new Error('Error generando token de autenticación');
  }
}

// Verificar JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'eclectique-backend',
      audience: 'eclectique-frontend'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    } else {
      throw new Error('Error verificando token');
    }
  }
}

// Extraer token del header Authorization
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

// Generar token de restablecimiento de contraseña (más corto)
function generateResetToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '1h', // Solo 1 hora para reset
      issuer: 'eclectique-backend',
      audience: 'eclectique-password-reset'
    });
  } catch (error) {
    console.error('Error generando token de reset:', error);
    throw new Error('Error generando token de restablecimiento');
  }
}

// Verificar token de restablecimiento
function verifyResetToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'eclectique-backend',
      audience: 'eclectique-password-reset'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token de restablecimiento expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token de restablecimiento inválido');
    } else {
      throw new Error('Error verificando token de restablecimiento');
    }
  }
}

// Configurar cookie de autenticación segura para HTTPS
function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('auth_token', token, {
    httpOnly: true, // Solo accesible desde servidor, no desde JavaScript del cliente
    secure: true, // Siempre usar HTTPS (compatible con Caddy proxy)
    sameSite: 'lax', // Protección CSRF pero permite navegación cross-origin
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
    domain: isProduction ? '.eclectiquebykmc.com' : undefined, // Solo en producción
    path: '/' // Disponible en toda la aplicación
  });
}

// Limpiar cookie de autenticación
function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    domain: isProduction ? '.eclectiquebykmc.com' : undefined,
    path: '/'
  });
}

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  generateResetToken,
  verifyResetToken,
  setAuthCookie,
  clearAuthCookie
};