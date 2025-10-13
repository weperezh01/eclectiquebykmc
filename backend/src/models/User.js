const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Inicializar tabla de usuarios
  static async initTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100),
        telefono VARCHAR(20),
        fecha_nacimiento DATE,
        genero VARCHAR(20),
        avatar VARCHAR(255),
        newsletter_subscribed BOOLEAN DEFAULT false,
        rol VARCHAR(50) DEFAULT 'usuario',
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
    `;
    
    try {
      await query(createTableQuery);
      console.log('✅ Tabla usuarios creada/verificada exitosamente');
      
      // Ejecutar migración para agregar newsletter_subscribed si es necesario
      await User.runNewsletterMigration();
      
      // Crear usuario admin por defecto si no existe
      await User.createDefaultAdmin();
    } catch (error) {
      console.error('❌ Error creando tabla usuarios:', error);
      throw error;
    }
  }

  // Ejecutar migración de newsletter
  static async runNewsletterMigration() {
    try {
      // Check if column already exists
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'newsletter_subscribed'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔄 Agregando columna newsletter_subscribed...');
        
        // Add the column with default value
        await query(`
          ALTER TABLE usuarios 
          ADD COLUMN newsletter_subscribed BOOLEAN DEFAULT false;
        `);
        
        // Update existing users to have default newsletter preference
        await query(`
          UPDATE usuarios 
          SET newsletter_subscribed = false 
          WHERE newsletter_subscribed IS NULL;
        `);
        
        console.log('✅ Columna newsletter_subscribed agregada exitosamente');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo ejecutar migración de newsletter_subscribed:', error.message);
    }
  }

  // Crear usuario admin por defecto
  static async createDefaultAdmin() {
    try {
      const adminExists = await User.findByEmail('admin@eclectiquebykmc.com');
      
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('Admin2024!KMC', 12);
        
        await query(`
          INSERT INTO usuarios (email, password, nombre, apellido, rol)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          'admin@eclectiquebykmc.com',
          hashedPassword,
          'Administrador',
          'Sistema',
          'admin'
        ]);
        
        console.log('✅ Usuario admin creado: admin@eclectiquebykmc.com / Admin2024!KMC');
      }
    } catch (error) {
      console.error('❌ Error creando usuario admin:', error);
    }
  }

  // Crear nuevo usuario
  static async create(userData) {
    const { email, password, nombre, apellido, telefono, fechaNacimiento, genero, newsletterSubscribed } = userData;
    
    try {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const result = await query(`
        INSERT INTO usuarios (email, password, nombre, apellido, telefono, fecha_nacimiento, genero, newsletter_subscribed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, nombre, apellido, telefono, fecha_nacimiento, genero, newsletter_subscribed, rol, activo, fecha_creacion
      `, [email, hashedPassword, nombre, apellido, telefono, fechaNacimiento, genero, newsletterSubscribed || false]);
      
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('El email ya está registrado');
      }
      throw error;
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const result = await query(
        'SELECT id, email, nombre, apellido, telefono, fecha_nacimiento, genero, avatar, newsletter_subscribed, rol, activo, fecha_creacion FROM usuarios WHERE id = $1 AND activo = true',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Validar contraseña
  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar usuario
  static async update(id, userData) {
    const { nombre, apellido, telefono, fechaNacimiento, genero, avatar, newsletterSubscribed } = userData;
    
    try {
      const result = await query(`
        UPDATE usuarios 
        SET nombre = $2, apellido = $3, telefono = $4, fecha_nacimiento = $5, 
            genero = $6, avatar = $7, newsletter_subscribed = $8, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1 AND activo = true
        RETURNING id, email, nombre, apellido, telefono, fecha_nacimiento, genero, avatar, newsletter_subscribed, rol, activo
      `, [id, nombre, apellido, telefono, fechaNacimiento, genero, avatar, newsletterSubscribed]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Cambiar contraseña
  static async changePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await query(`
        UPDATE usuarios 
        SET password = $2, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1 AND activo = true
      `, [id, hashedPassword]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los usuarios (solo admin)
  static async getAll() {
    try {
      const result = await query(`
        SELECT id, email, nombre, apellido, telefono, fecha_nacimiento, genero, 
               avatar, newsletter_subscribed, rol, activo, fecha_creacion, fecha_actualizacion
        FROM usuarios 
        ORDER BY fecha_creacion DESC
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Desactivar usuario
  static async deactivate(id) {
    try {
      await query(`
        UPDATE usuarios 
        SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar estado activo/inactivo del usuario
  static async updateStatus(id, isActive) {
    try {
      await query(`
        UPDATE usuarios 
        SET activo = $2, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id, isActive]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Promover usuario a administrador
  static async makeAdmin(id) {
    try {
      await query(`
        UPDATE usuarios 
        SET rol = 'admin', fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Remover privilegios de administrador
  static async removeAdmin(id) {
    try {
      await query(`
        UPDATE usuarios 
        SET rol = 'usuario', fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario permanentemente
  static async delete(id) {
    try {
      await query('DELETE FROM usuarios WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;