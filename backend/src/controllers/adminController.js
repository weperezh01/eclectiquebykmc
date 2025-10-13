const User = require('../models/User');

// Obtener todos los usuarios (solo admin)
async function getAllUsers(req, res) {
  try {
    const users = await User.getAll();
    
    // Transformar formato para el frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.nombre,
      email: user.email,
      is_active: user.activo,
      is_admin: user.rol === 'admin'
    }));
    
    res.json(transformedUsers);
    
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Obtener estadísticas del dashboard
async function getDashboardStats(req, res) {
  try {
    const users = await User.getAll();
    
    const stats = {
      totalUsuarios: users.length,
      usuariosActivos: users.filter(u => u.activo).length,
      usuariosInactivos: users.filter(u => !u.activo).length,
      administradores: users.filter(u => u.rol === 'admin').length,
      usuariosRegulares: users.filter(u => u.rol === 'usuario').length,
      usuariosHoy: users.filter(u => {
        const hoy = new Date();
        const fechaUsuario = new Date(u.fecha_creacion);
        return fechaUsuario.toDateString() === hoy.toDateString();
      }).length,
      usuariosEstesMes: users.filter(u => {
        const hoy = new Date();
        const fechaUsuario = new Date(u.fecha_creacion);
        return fechaUsuario.getMonth() === hoy.getMonth() && 
               fechaUsuario.getFullYear() === hoy.getFullYear();
      }).length
    };
    
    res.json({
      success: true,
      data: {
        stats,
        recentUsers: users.slice(0, 5) // Últimos 5 usuarios
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Activar/desactivar usuario
async function toggleUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    await User.updateStatus(userId, is_active);
    
    res.json({
      success: true,
      message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente`
    });
    
  } catch (error) {
    console.error('Error cambiando estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Promover usuario a admin
async function promoteUser(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    if (user.is_admin) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es administrador'
      });
    }
    
    await User.makeAdmin(userId);
    
    res.json({
      success: true,
      message: 'Usuario promovido a administrador exitosamente'
    });
    
  } catch (error) {
    console.error('Error promoviendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Quitar privilegios de admin
async function demoteUser(req, res) {
  try {
    const { userId } = req.params;
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes quitarte tus propios privilegios de admin'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    if (!user.is_admin) {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es administrador'
      });
    }
    
    await User.removeAdmin(userId);
    
    res.json({
      success: true,
      message: 'Privilegios de administrador removidos exitosamente'
    });
    
  } catch (error) {
    console.error('Error quitando privilegios de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Obtener usuario específico
async function getUser(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

module.exports = {
  getAllUsers,
  getDashboardStats,
  toggleUserStatus,
  promoteUser,
  demoteUser,
  getUser
};