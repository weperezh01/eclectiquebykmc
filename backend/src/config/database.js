const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eclectiquebykmc_db',
  user: process.env.DB_USER || 'well',
  password: process.env.DB_PASSWORD || '874494Aa.',
  // Configuración adicional para conexiones
  ssl: false, // Deshabilitar SSL para Docker
  max: 20, // Máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // Cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 2000, // Tiempo de espera para nuevas conexiones
});

// Event listeners para debugging
pool.on('connect', (client) => {
  console.log('Nueva conexión establecida con la base de datos');
});

pool.on('error', (err, client) => {
  console.error('Error inesperado en cliente de base de datos:', err);
  process.exit(-1);
});

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    
    // Crear base de datos si no existe
    await client.query(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'eclectiquebykmc_db'}
    `).catch(() => {
      // Ignorar error si la base de datos ya existe
      console.log('Base de datos ya existe o no se puede crear');
    });
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err);
    return false;
  }
}

// Función para ejecutar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', { text, error: error.message });
    throw error;
  }
}

// Función para obtener un cliente del pool
async function getClient() {
  return await pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};