import { Pool } from 'pg';

// Database connection configuration
const pool = new Pool({
  user: 'well',
  password: '874494Aa.',
  host: 'postgres-db', // Docker container name
  port: 5432,
  database: 'eclectiquebykmc_db'
});

export { pool };

// Database initialization function
export async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Create guides table
    await client.query(`
      CREATE TABLE IF NOT EXISTS guides (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        intro TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create guide_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS guide_items (
        id SERIAL PRIMARY KEY,
        guide_id INTEGER REFERENCES guides(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        href VARCHAR(500) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_guide_items_guide_id ON guide_items(guide_id)
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Guide database functions
export async function getAllGuides() {
  const client = await pool.connect();
  
  try {
    const guidesResult = await client.query(`
      SELECT id, slug, title, intro, youtube_url, created_at, updated_at 
      FROM guides 
      ORDER BY created_at DESC
    `);
    
    const guides = [];
    
    for (const guide of guidesResult.rows) {
      const itemsResult = await client.query(`
        SELECT title, image_url as image, href 
        FROM guide_items 
        WHERE guide_id = $1 
        ORDER BY id ASC
      `, [guide.id]);
      
      guides.push({
        slug: guide.slug,
        title: guide.title,
        intro: guide.intro,
        youtubeUrl: guide.youtube_url,
        items: itemsResult.rows,
        created_at: guide.created_at,
        updated_at: guide.updated_at
      });
    }
    
    return guides;
  } finally {
    client.release();
  }
}

export async function getGuideBySlug(slug: string) {
  const client = await pool.connect();
  
  try {
    const guideResult = await client.query(`
      SELECT id, slug, title, intro, youtube_url, created_at, updated_at 
      FROM guides 
      WHERE slug = $1
    `, [slug]);
    
    if (guideResult.rows.length === 0) {
      return null;
    }
    
    const guide = guideResult.rows[0];
    
    const itemsResult = await client.query(`
      SELECT title, image_url as image, href 
      FROM guide_items 
      WHERE guide_id = $1 
      ORDER BY sort_order ASC, id ASC
    `, [guide.id]);
    
    return {
      slug: guide.slug,
      title: guide.title,
      intro: guide.intro,
      youtubeUrl: guide.youtube_url,
      items: itemsResult.rows,
      created_at: guide.created_at,
      updated_at: guide.updated_at
    };
  } finally {
    client.release();
  }
}

export async function createGuide(guideData: {
  slug: string;
  title: string;
  intro: string;
  youtubeUrl?: string;
  items: Array<{ title: string; image: string; href: string }>;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create the guide
    const guideResult = await client.query(`
      INSERT INTO guides (slug, title, intro, youtube_url) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id
    `, [guideData.slug, guideData.title, guideData.intro, guideData.youtubeUrl || null]);
    
    const guideId = guideResult.rows[0].id;
    
    // Create the guide items
    for (let i = 0; i < guideData.items.length; i++) {
      const item = guideData.items[i];
      await client.query(`
        INSERT INTO guide_items (guide_id, title, image_url, href) 
        VALUES ($1, $2, $3, $4)
      `, [guideId, item.title, item.image, item.href]);
    }
    
    await client.query('COMMIT');
    return { success: true, id: guideId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateGuide(slug: string, guideData: {
  title: string;
  intro: string;
  youtubeUrl?: string;
  items: Array<{ title: string; image: string; href: string }>;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update the guide
    const guideResult = await client.query(`
      UPDATE guides 
      SET title = $1, intro = $2, youtube_url = $3, updated_at = CURRENT_TIMESTAMP 
      WHERE slug = $4 
      RETURNING id
    `, [guideData.title, guideData.intro, guideData.youtubeUrl || null, slug]);
    
    if (guideResult.rows.length === 0) {
      throw new Error('Guide not found');
    }
    
    const guideId = guideResult.rows[0].id;
    
    // Delete existing items
    await client.query('DELETE FROM guide_items WHERE guide_id = $1', [guideId]);
    
    // Create new items
    for (let i = 0; i < guideData.items.length; i++) {
      const item = guideData.items[i];
      await client.query(`
        INSERT INTO guide_items (guide_id, title, image_url, href) 
        VALUES ($1, $2, $3, $4)
      `, [guideId, item.title, item.image, item.href]);
    }
    
    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteGuide(slug: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query('DELETE FROM guides WHERE slug = $1', [slug]);
    return result.rowCount && result.rowCount > 0;
  } finally {
    client.release();
  }
}