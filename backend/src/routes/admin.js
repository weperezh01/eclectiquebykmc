const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  getDashboardStats,
  toggleUserStatus,
  promoteUser,
  demoteUser,
  getUser
} = require('../controllers/adminController');

const router = express.Router();

// Rate limiting para rutas de admin
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Máximo 200 requests por ventana de tiempo para admins
  message: {
    success: false,
    message: 'Demasiadas solicitudes de administración. Intenta nuevamente más tarde.'
  }
});

// Middleware: todas las rutas requieren autenticación Y rol de admin
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

// Rutas del panel de administración
router.get('/dashboard/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUser);
router.put('/users/:userId/status', toggleUserStatus);
router.post('/users/:userId/promote', promoteUser);
router.post('/users/:userId/demote', demoteUser);

module.exports = router;