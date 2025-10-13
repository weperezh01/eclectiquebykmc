const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  updateProfileSimple,
  changePassword,
  changePasswordSimple,
  forgotPassword,
  resetPassword,
  avatarUpload,
  uploadAvatar,
  deleteAvatar,
  deleteAccount
} = require('../controllers/authController');

const router = express.Router();

// Rate limiting para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Máximo 500 intentos por ventana de tiempo (incrementado para desarrollo)
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por ventana de tiempo
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.'
  }
});

// Rutas públicas (con rate limiting estricto)
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Logout puede ser público o protegido - lo ponemos como público para compatibilidad
router.post('/logout', authLimiter, logout);

// Rutas protegidas (requieren autenticación)
router.use(authenticate); // A partir de aquí todas las rutas requieren autenticación
router.use(generalLimiter); // Rate limiting más relajado para usuarios autenticados

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.patch('/me', updateProfileSimple); // Para frontend
router.delete('/me', deleteAccount); // Eliminar cuenta
router.put('/change-password', changePassword);
router.post('/me/password', changePasswordSimple); // Para frontend
router.post('/me/avatar', avatarUpload.single('file'), uploadAvatar); // Para frontend
router.delete('/me/avatar', deleteAvatar); // Para frontend

module.exports = router;