const { query } = require('../config/database');

/**
 * Migration to add newsletter_subscribed column to usuarios table
 * This can be run safely multiple times (idempotent)
 */
async function addNewsletterColumn() {
  try {
    console.log('🔄 Ejecutando migración: Agregando columna newsletter_subscribed...');
    
    // Check if column already exists
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name = 'newsletter_subscribed'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ La columna newsletter_subscribed ya existe, saltando migración.');
      return;
    }
    
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
    
    console.log('✅ Migración completada: Columna newsletter_subscribed agregada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en migración newsletter_subscribed:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { addNewsletterColumn };

// Allow running directly
if (require.main === module) {
  addNewsletterColumn()
    .then(() => {
      console.log('✅ Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migración falló:', error);
      process.exit(1);
    });
}