const User = require('../models/User');
const { generateToken, generateResetToken, verifyResetToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');
const validator = require('validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Registro de usuario
async function register(req, res) {
  try {
    console.log('[REGISTER DEBUG] Body recibido:', JSON.stringify(req.body));
    const { email, password, nombre, name, apellido, telefono, fechaNacimiento, genero, newsletter_subscribed } = req.body;
    // Permitir tanto 'nombre' como 'name' para compatibilidad
    const finalNombre = nombre || name;
    console.log('[REGISTER DEBUG] finalNombre:', finalNombre);
    
    // Validaciones
    if (!email || !password || !finalNombre) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son obligatorios'
      });
    }
    
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email no válido'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }
    
    // Crear nuevo usuario
    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      password,
      nombre: finalNombre.trim(),
      apellido: apellido?.trim() || '',
      telefono: telefono?.trim() || null,
      fechaNacimiento: fechaNacimiento || null,
      genero: genero || null,
      newsletterSubscribed: newsletter_subscribed || false
    });
    
    // Generar token
    const token = generateToken({ 
      userId: newUser.id, 
      email: newUser.email,
      rol: newUser.rol 
    });
    
    // Establecer cookie de autenticación
    setAuthCookie(res, token);
    
    // Responder con éxito
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          telefono: newUser.telefono,
          fechaNacimiento: newUser.fecha_nacimiento,
          genero: newUser.genero,
          newsletter_subscribed: newUser.newsletter_subscribed,
          rol: newUser.rol
        },
        token // También incluir token en respuesta para compatibilidad
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
}

// Inicio de sesión
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }
    
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email no válido'
      });
    }
    
    // Buscar usuario
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Verificar contraseña
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generar token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      rol: user.rol 
    });
    
    // Establecer cookie de autenticación
    setAuthCookie(res, token);
    
    // Responder con éxito
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: user.telefono,
          fechaNacimiento: user.fecha_nacimiento,
          genero: user.genero,
          avatar: user.avatar,
          newsletter_subscribed: user.newsletter_subscribed,
          rol: user.rol
        },
        token // También incluir token en respuesta para compatibilidad
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Obtener perfil del usuario autenticado
async function getProfile(req, res) {
  try {
    const user = req.user; // Viene del middleware de autenticación
    
    // Devolver datos directamente para compatibilidad con frontend
    res.json({
      id: user.id,
      email: user.email,
      name: user.nombre, // Frontend espera 'name'
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
      fecha_nacimiento: user.fecha_nacimiento,
      fechaNacimiento: user.fecha_nacimiento, // Frontend espera este formato
      genero: user.genero,
      avatar: user.avatar,
      avatar_url: user.avatar,
      newsletter_subscribed: user.newsletter_subscribed,
      rol: user.rol,
      is_admin: user.rol === 'admin', // Para compatibilidad con frontend
      created_at: user.fecha_creacion,
      fechaCreacion: user.fecha_creacion,
      success: true
    });
    
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Actualizar perfil
async function updateProfile(req, res) {
  try {
    const { nombre, apellido, telefono, fechaNacimiento, genero, newsletter_subscribed } = req.body;
    const userId = req.user.id;
    
    // Validaciones básicas
    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }
    
    // Actualizar usuario
    const updatedUser = await User.update(userId, {
      nombre: nombre.trim(),
      apellido: apellido?.trim() || '',
      telefono: telefono?.trim() || null,
      fechaNacimiento: fechaNacimiento || null,
      genero: genero || null,
      avatar: req.user.avatar, // Mantener avatar actual
      newsletterSubscribed: newsletter_subscribed || false
    });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: updatedUser
      }
    });
    
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Cambiar contraseña
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validaciones
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son obligatorias'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Verificar contraseña actual
    const user = await User.findByEmail(req.user.email);
    const isValidPassword = await User.validatePassword(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Cambiar contraseña
    await User.changePassword(userId, newPassword);
    
    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Solicitar restablecimiento de contraseña
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email válido requerido'
      });
    }
    
    // Buscar usuario
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }
    
    // Generar token de reset
    const resetToken = generateResetToken({ 
      userId: user.id, 
      email: user.email 
    });
    
    // TODO: En una implementación real, aquí enviarías un email
    console.log(`Token de reset para ${email}: ${resetToken}`);
    
    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña',
      // SOLO para desarrollo - eliminar en producción
      _dev_reset_token: resetToken
    });
    
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Restablecer contraseña
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son obligatorios'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Verificar token
    const decoded = verifyResetToken(token);
    
    // Buscar usuario
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o usuario no encontrado'
      });
    }
    
    // Cambiar contraseña
    await User.changePassword(user.id, newPassword);
    
    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
    
  } catch (error) {
    console.error('Error en reset password:', error);
    
    if (error.message.includes('Token')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Actualizar perfil (compatible con frontend, maneja todos los campos)
async function updateProfileSimple(req, res) {
  try {
    const { name, apellido, telefono, fecha_nacimiento, genero, newsletter_subscribed } = req.body;
    const userId = req.user.id;
    
    // Usar el nombre existente si no se proporciona uno nuevo
    const finalName = name || req.user.nombre;
    
    // Validación básica
    if (!finalName || finalName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }
    
    // Actualizar usuario con todos los campos disponibles
    const updatedUser = await User.update(userId, {
      nombre: finalName.trim(),
      apellido: apellido !== undefined ? apellido?.trim() || '' : req.user.apellido,
      telefono: telefono !== undefined ? telefono?.trim() || null : req.user.telefono,
      fechaNacimiento: fecha_nacimiento !== undefined ? fecha_nacimiento || null : req.user.fecha_nacimiento,
      genero: genero !== undefined ? genero || null : req.user.genero,
      avatar: req.user.avatar,
      newsletterSubscribed: newsletter_subscribed !== undefined ? newsletter_subscribed : req.user.newsletter_subscribed
    });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Devolver formato compatible con frontend
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.nombre,
      nombre: updatedUser.nombre,
      apellido: updatedUser.apellido,
      telefono: updatedUser.telefono,
      fecha_nacimiento: updatedUser.fecha_nacimiento,
      fechaNacimiento: updatedUser.fecha_nacimiento,
      genero: updatedUser.genero,
      avatar: updatedUser.avatar,
      avatar_url: updatedUser.avatar,
      newsletter_subscribed: updatedUser.newsletter_subscribed,
      rol: updatedUser.rol,
      created_at: updatedUser.fecha_creacion,
      fechaCreacion: updatedUser.fecha_creacion,
      success: true
    });
    
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Cambiar contraseña (formato frontend)
async function changePasswordSimple(req, res) {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;
    
    // Validaciones
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son obligatorias'
      });
    }
    
    if (new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }
    
    // Verificar contraseña actual
    const user = await User.findByEmail(req.user.email);
    const isValidPassword = await User.validatePassword(current_password, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Cambiar contraseña
    await User.changePassword(userId, new_password);
    
    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Configuración de multer para avatares
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = '/app/uploads/avatars';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const fileName = `avatar_${req.user.id}_${Date.now()}${extension}`;
    cb(null, fileName);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: function (req, file, cb) {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Subir avatar
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Eliminar avatar anterior si existe
    const currentUser = await User.findById(req.user.id);
    if (currentUser.avatar) {
      const oldAvatarPath = path.join('/app/uploads/avatars', path.basename(currentUser.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Actualizar usuario con nueva ruta de avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await User.update(req.user.id, {
      nombre: currentUser.nombre,
      apellido: currentUser.apellido,
      telefono: currentUser.telefono,
      fechaNacimiento: currentUser.fecha_nacimiento,
      genero: currentUser.genero,
      avatar: avatarUrl,
      newsletterSubscribed: currentUser.newsletter_subscribed
    });

    // Devolver formato compatible con frontend
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.nombre,
      nombre: updatedUser.nombre,
      apellido: updatedUser.apellido,
      telefono: updatedUser.telefono,
      fecha_nacimiento: updatedUser.fecha_nacimiento,
      fechaNacimiento: updatedUser.fecha_nacimiento,
      genero: updatedUser.genero,
      avatar: updatedUser.avatar,
      avatar_url: updatedUser.avatar,
      newsletter_subscribed: updatedUser.newsletter_subscribed,
      rol: updatedUser.rol,
      created_at: updatedUser.fecha_creacion,
      fechaCreacion: updatedUser.fecha_creacion,
      success: true
    });

  } catch (error) {
    console.error('Error subiendo avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Eliminar avatar
async function deleteAvatar(req, res) {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Eliminar archivo del sistema si existe
    if (currentUser.avatar) {
      const avatarPath = path.join('/app/uploads/avatars', path.basename(currentUser.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Actualizar usuario sin avatar
    const updatedUser = await User.update(req.user.id, {
      nombre: currentUser.nombre,
      apellido: currentUser.apellido,
      telefono: currentUser.telefono,
      fechaNacimiento: currentUser.fecha_nacimiento,
      genero: currentUser.genero,
      avatar: null,
      newsletterSubscribed: currentUser.newsletter_subscribed
    });

    // Devolver formato compatible con frontend
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.nombre,
      nombre: updatedUser.nombre,
      apellido: updatedUser.apellido,
      telefono: updatedUser.telefono,
      fecha_nacimiento: updatedUser.fecha_nacimiento,
      fechaNacimiento: updatedUser.fecha_nacimiento,
      genero: updatedUser.genero,
      avatar: null,
      avatar_url: null,
      newsletter_subscribed: updatedUser.newsletter_subscribed,
      rol: updatedUser.rol,
      created_at: updatedUser.fecha_creacion,
      fechaCreacion: updatedUser.fecha_creacion,
      success: true
    });

  } catch (error) {
    console.error('Error eliminando avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Cerrar sesión (logout)
async function logout(req, res) {
  try {
    // Limpiar cookie de autenticación
    clearAuthCookie(res);
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
    
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// Eliminar cuenta de usuario
async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Eliminar avatar del sistema si existe
    if (currentUser.avatar) {
      const avatarPath = path.join('/app/uploads/avatars', path.basename(currentUser.avatar));
      if (fs.existsSync(avatarPath)) {
        try {
          fs.unlinkSync(avatarPath);
        } catch (fileError) {
          console.warn('No se pudo eliminar el archivo de avatar:', fileError.message);
        }
      }
    }

    // Eliminar usuario permanentemente de la base de datos
    await User.delete(userId);

    // Limpiar cookie de autenticación
    clearAuthCookie(res);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

module.exports = {
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
};