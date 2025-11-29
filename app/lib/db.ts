import { Pool } from 'pg';

// Database connection configuration
const dbUser = process.env.DB_USER || 'well';
const dbHost = process.env.DB_HOST || 'postgres-db'; // Docker container name or host
const dbPort = parseInt(process.env.DB_PORT || '5432');
const dbName = process.env.DB_NAME || 'eclectiquebykmc_db';

const pool = new Pool({
  user: dbUser,
  // Do not hardcode passwords; rely on env when needed
  password: process.env.DB_PASSWORD || undefined,
  host: dbHost,
  port: dbPort,
  database: dbName
});

// Safe connection info (without secrets) for diagnostics
try {
  // Minimal, non-sensitive log; helps detect wrong DB wiring in containers
  console.log(
    `[DB] Connecting to ${dbHost}:${dbPort}/${dbName} as ${dbUser}`
  );
} catch {}

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
        cover_image VARCHAR(500),
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

    // Create guide_videos table for multiple videos per guide (YouTube, Instagram, Facebook, TikTok)
    await client.query(`
      CREATE TABLE IF NOT EXISTS guide_videos (
        id SERIAL PRIMARY KEY,
        guide_id INTEGER REFERENCES guides(id) ON DELETE CASCADE,
        platform VARCHAR(20) NOT NULL DEFAULT 'youtube',
        video_url VARCHAR(500) NOT NULL,
        youtube_url VARCHAR(500), -- Keep for backward compatibility, can be NULL
        title VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add platform column if it doesn't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guide_videos ADD COLUMN platform VARCHAR(20) DEFAULT 'youtube';
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add video_url column if it doesn't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guide_videos ADD COLUMN video_url VARCHAR(500);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Remove NOT NULL constraint from youtube_url column (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guide_videos ALTER COLUMN youtube_url DROP NOT NULL;
        EXCEPTION
          WHEN others THEN NULL;
        END;
      END $$;
    `);

    // Add cover_image column if it doesn't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guides ADD COLUMN cover_image VARCHAR(500);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add is_public column if it doesn't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guides ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add guide_type column to guides table (Look or Deal)
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guides ADD COLUMN guide_type VARCHAR(10) DEFAULT 'Look';
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add is_featured column to guides table for homepage display
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guides ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Migrate existing youtube_url to video_url and set platform
    await client.query(`
      UPDATE guide_videos 
      SET video_url = youtube_url, platform = 'youtube' 
      WHERE video_url IS NULL AND youtube_url IS NOT NULL;
    `);

    // Add is_featured column to guide_items if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE guide_items ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Create productos table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(20) NOT NULL DEFAULT 'afiliado', -- 'afiliado' | 'propio'
        marketplace VARCHAR(50),
        enlace_url TEXT,
        imagen_url TEXT,
        precio NUMERIC(12,2),
        moneda VARCHAR(3),
        destacado BOOLEAN DEFAULT FALSE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add guide_id to productos table for guide item support
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE productos ADD COLUMN guide_id INTEGER REFERENCES guides(id) ON DELETE CASCADE;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add sort_order to productos table for guide item ordering
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE productos ADD COLUMN sort_order INTEGER DEFAULT 0;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add categorias column for compatibility
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE productos ADD COLUMN categorias TEXT[];
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Create product_images table for multiple images per product
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate English column names to Spanish for productos table
    await client.query(`
      DO $$ 
      BEGIN 
        -- Add Spanish columns if they don't exist
        BEGIN
          ALTER TABLE productos ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE productos ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
        
        -- Copy data from English columns to Spanish columns if English columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'created_at') THEN
          UPDATE productos SET fecha_creacion = created_at WHERE fecha_creacion IS NULL;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'updated_at') THEN
          UPDATE productos SET fecha_actualizacion = updated_at WHERE fecha_actualizacion IS NULL;
        END IF;
        
        -- Drop English columns if they exist
        BEGIN
          ALTER TABLE productos DROP COLUMN IF EXISTS created_at;
        EXCEPTION
          WHEN others THEN NULL;
        END;
        
        BEGIN
          ALTER TABLE productos DROP COLUMN IF EXISTS updated_at;
        EXCEPTION
          WHEN others THEN NULL;
        END;
      END $$;
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_guide_items_guide_id ON guide_items(guide_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_guide_videos_guide_id ON guide_videos(guide_id)
    `);

    // Create deals table (similar to guides but for deals)
    await client.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        intro TEXT NOT NULL,
        cover_image VARCHAR(500),
        discount_percentage INTEGER,
        is_public BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deal_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_items (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        href VARCHAR(500) NOT NULL,
        original_price NUMERIC(12,2),
        sale_price NUMERIC(12,2),
        discount_percentage INTEGER,
        sort_order INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deal_videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_videos (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
        platform VARCHAR(20) NOT NULL DEFAULT 'youtube',
        video_url VARCHAR(500) NOT NULL,
        title VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for productos table
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_productos_guide_id ON productos(guide_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo)
    `);

    // Create indexes for deals tables
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deal_items_deal_id ON deal_items(deal_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deal_videos_deal_id ON deal_videos(deal_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_deals_is_public ON deals(is_public)
    `);

    // Create stripe_config table for payment processing
    await client.query(`
      CREATE TABLE IF NOT EXISTS stripe_config (
        id SERIAL PRIMARY KEY,
        public_key VARCHAR(255),
        secret_key VARCHAR(255),
        webhook_secret VARCHAR(255),
        environment VARCHAR(20) DEFAULT 'sandbox',
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create payment_intents table for order processing
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id SERIAL PRIMARY KEY,
        intent_id VARCHAR(255) UNIQUE NOT NULL,
        stripe_intent_id VARCHAR(255),
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        shipping_address JSONB,
        items JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table for completed orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(255),
        postal_code VARCHAR(20),
        country VARCHAR(255),
        items JSONB NOT NULL,
        total NUMERIC(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending',
        payment_intent_id VARCHAR(255),
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to existing payment_intents table
    await client.query(`
      DO $$ 
      BEGIN 
        -- Add stripe_intent_id column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'payment_intents' AND column_name = 'stripe_intent_id'
        ) THEN
          ALTER TABLE payment_intents ADD COLUMN stripe_intent_id VARCHAR(255);
        END IF;
        
        -- Add updated_at column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'payment_intents' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE payment_intents ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        -- Add notes column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'payment_intents' AND column_name = 'notes'
        ) THEN
          ALTER TABLE payment_intents ADD COLUMN notes TEXT;
        END IF;
      END $$;
    `);

    // Add missing columns to existing orders table
    await client.query(`
      DO $$ 
      BEGIN 
        -- Add notes column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'notes'
        ) THEN
          ALTER TABLE orders ADD COLUMN notes TEXT;
        END IF;
        
        -- Add updated_at column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `);

    // Migrate guide_items to productos table
    await client.query(`
      INSERT INTO productos (
        titulo, imagen_url, enlace_url, destacado, 
        guide_id, sort_order, tipo, marketplace, activo, fecha_creacion
      )
      SELECT 
        gi.title, gi.image_url, gi.href, gi.is_featured,
        gi.guide_id, gi.sort_order, 'afiliado', 'Guías', true, gi.created_at
      FROM guide_items gi
      WHERE NOT EXISTS (
        SELECT 1 FROM productos p 
        WHERE p.guide_id = gi.guide_id 
        AND p.titulo = gi.title 
        AND p.enlace_url = gi.href
      )
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
export async function getPublicGuides() {
  const client = await pool.connect();
  
  try {
    const guidesResult = await client.query(`
      SELECT id, slug, title, intro, youtube_url, cover_image, is_public, is_featured, sort_order, guide_type, created_at, updated_at 
      FROM guides 
      WHERE is_public = TRUE
      ORDER BY sort_order ASC, created_at DESC
    `);
    
    const guides = [];
    
    for (const guide of guidesResult.rows) {
      const itemsResult = await client.query(`
        SELECT titulo as title, imagen_url as image, enlace_url as href, destacado as is_featured 
        FROM productos 
        WHERE guide_id = $1 
        ORDER BY sort_order ASC, id ASC
      `, [guide.id]);

      const videosResult = await client.query(`
        SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
        FROM guide_videos 
        WHERE guide_id = $1 
        ORDER BY is_primary DESC, sort_order ASC, id ASC
      `, [guide.id]);
      
      console.log(`=== getPublicGuides for ${guide.slug} ===`);
      console.log('Videos from DB:', videosResult.rows);
      
      // MIGRATION: If there's a youtube_url but no videos in guide_videos, migrate it
      let finalVideos = videosResult.rows;
      if (guide.youtube_url && guide.youtube_url.trim() && videosResult.rows.length === 0) {
        try {
          await client.query(`
            INSERT INTO guide_videos (guide_id, platform, video_url, youtube_url, title, is_primary, sort_order) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [guide.id, 'youtube', guide.youtube_url, guide.youtube_url, null, true, 0]);
          
          // Re-fetch videos after migration
          const migratedVideosResult = await client.query(`
            SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
            FROM guide_videos 
            WHERE guide_id = $1 
            ORDER BY is_primary DESC, sort_order ASC, id ASC
          `, [guide.id]);
          
          finalVideos = migratedVideosResult.rows;
          console.log(`Migrated legacy video for guide ${guide.slug}`);
        } catch (migrationError) {
          console.error(`Failed to migrate video for guide ${guide.slug}:`, migrationError);
        }
      }
      
      guides.push({
        slug: guide.slug,
        title: guide.title,
        intro: guide.intro,
        youtubeUrl: guide.youtube_url, // Keep for backward compatibility
        coverImage: guide.cover_image,
        isPublic: guide.is_public,
        isFeatured: guide.is_featured,
        sortOrder: guide.sort_order,
        guideType: guide.guide_type,
        videos: finalVideos,
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

export async function getAllGuides() {
  const client = await pool.connect();
  
  try {
    const guidesResult = await client.query(`
      SELECT id, slug, title, intro, youtube_url, cover_image, is_public, is_featured, sort_order, guide_type, created_at, updated_at 
      FROM guides 
      ORDER BY sort_order ASC, created_at DESC
    `);
    
    const guides = [];
    
    for (const guide of guidesResult.rows) {
      const itemsResult = await client.query(`
        SELECT titulo as title, imagen_url as image, enlace_url as href, destacado as is_featured 
        FROM productos 
        WHERE guide_id = $1 
        ORDER BY sort_order ASC, id ASC
      `, [guide.id]);

      const videosResult = await client.query(`
        SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
        FROM guide_videos 
        WHERE guide_id = $1 
        ORDER BY is_primary DESC, sort_order ASC, id ASC
      `, [guide.id]);
      
      console.log(`=== getAllGuides for ${guide.slug} ===`);
      console.log('Videos from DB:', videosResult.rows);
      
      // MIGRATION: If there's a youtube_url but no videos in guide_videos, migrate it
      let finalVideos = videosResult.rows;
      if (guide.youtube_url && guide.youtube_url.trim() && videosResult.rows.length === 0) {
        try {
          await client.query(`
            INSERT INTO guide_videos (guide_id, platform, video_url, youtube_url, title, is_primary, sort_order) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [guide.id, 'youtube', guide.youtube_url, guide.youtube_url, null, true, 0]);
          
          // Re-fetch videos after migration
          const migratedVideosResult = await client.query(`
            SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
            FROM guide_videos 
            WHERE guide_id = $1 
            ORDER BY is_primary DESC, sort_order ASC, id ASC
          `, [guide.id]);
          
          finalVideos = migratedVideosResult.rows;
          console.log(`Migrated legacy video for guide ${guide.slug}`);
        } catch (migrationError) {
          console.error(`Failed to migrate video for guide ${guide.slug}:`, migrationError);
        }
      }
      
      guides.push({
        slug: guide.slug,
        title: guide.title,
        intro: guide.intro,
        youtubeUrl: guide.youtube_url, // Keep for backward compatibility
        coverImage: guide.cover_image,
        isPublic: guide.is_public,
        isFeatured: guide.is_featured,
        sortOrder: guide.sort_order,
        guideType: guide.guide_type,
        videos: finalVideos,
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
      SELECT id, slug, title, intro, youtube_url, cover_image, is_public, is_featured, sort_order, guide_type, created_at, updated_at 
      FROM guides 
      WHERE slug = $1
    `, [slug]);
    
    if (guideResult.rows.length === 0) {
      return null;
    }
    
    const guide = guideResult.rows[0];
    
    const itemsResult = await client.query(`
      SELECT titulo as title, imagen_url as image, enlace_url as href, destacado as is_featured 
      FROM productos 
      WHERE guide_id = $1 
      ORDER BY sort_order ASC, id ASC
    `, [guide.id]);

    const videosResult = await client.query(`
      SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
      FROM guide_videos 
      WHERE guide_id = $1 
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `, [guide.id]);
    
    // MIGRATION: If there's a youtube_url but no videos in guide_videos, migrate it
    if (guide.youtube_url && guide.youtube_url.trim() && videosResult.rows.length === 0) {
      console.log(`Migrating legacy video for guide ${guide.slug}: ${guide.youtube_url}`);
      
      try {
        await client.query(`
          INSERT INTO guide_videos (guide_id, platform, video_url, youtube_url, title, is_primary, sort_order) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [guide.id, 'youtube', guide.youtube_url, guide.youtube_url, null, true, 0]);
        
        // Re-fetch videos after migration
        const migratedVideosResult = await client.query(`
          SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
          FROM guide_videos 
          WHERE guide_id = $1 
          ORDER BY is_primary DESC, sort_order ASC, id ASC
        `, [guide.id]);
        
        return {
          slug: guide.slug,
          title: guide.title,
          intro: guide.intro,
          youtubeUrl: guide.youtube_url, // Keep for backward compatibility
          coverImage: guide.cover_image,
          isPublic: guide.is_public,
          isFeatured: guide.is_featured,
          sortOrder: guide.sort_order,
          guideType: guide.guide_type,
          videos: migratedVideosResult.rows,
          items: itemsResult.rows,
          created_at: guide.created_at,
          updated_at: guide.updated_at
        };
      } catch (migrationError) {
        console.error(`Failed to migrate video for guide ${guide.slug}:`, migrationError);
        // Fall back to original behavior if migration fails
      }
    }
    
    return {
      slug: guide.slug,
      title: guide.title,
      intro: guide.intro,
      youtubeUrl: guide.youtube_url, // Keep for backward compatibility
      coverImage: guide.cover_image,
      isPublic: guide.is_public,
      isFeatured: guide.is_featured,
      sortOrder: guide.sort_order,
      guideType: guide.guide_type,
      videos: videosResult.rows,
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
  coverImage?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  guideType?: string;
  videos?: Array<{ platform: string; video_url: string; title?: string; is_primary?: boolean }>;
  items: Array<{ title: string; image: string; href: string; is_featured?: boolean }>;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create the guide
    const guideResult = await client.query(`
      INSERT INTO guides (slug, title, intro, youtube_url, cover_image, is_public, is_featured, sort_order, guide_type) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id
    `, [guideData.slug, guideData.title, guideData.intro, guideData.youtubeUrl || null, guideData.coverImage || null, guideData.isPublic !== undefined ? guideData.isPublic : true, guideData.isFeatured !== undefined ? guideData.isFeatured : false, guideData.sortOrder || 0, guideData.guideType || 'Look']);
    
    const guideId = guideResult.rows[0].id;
    
    // Create the guide videos if provided
    if (guideData.videos && guideData.videos.length > 0) {
      for (let i = 0; i < guideData.videos.length; i++) {
        const video = guideData.videos[i];
        const youtubeUrl = video.platform === 'youtube' ? video.video_url : null;
        await client.query(`
          INSERT INTO guide_videos (guide_id, platform, video_url, youtube_url, title, is_primary, sort_order) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [guideId, video.platform, video.video_url, youtubeUrl, video.title || null, video.is_primary || false, i]);
      }
    }
    
    // Create the guide items
    for (let i = 0; i < guideData.items.length; i++) {
      const item = guideData.items[i];
      await client.query(`
        INSERT INTO productos (guide_id, titulo, imagen_url, enlace_url, destacado, sort_order, tipo, marketplace, activo, fecha_creacion) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `, [guideId, item.title, item.image, item.href, item.is_featured || false, i, 'afiliado', 'Guías', true]);
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
  coverImage?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  guideType?: string;
  videos?: Array<{ platform: string; video_url: string; title?: string; is_primary?: boolean }>;
  items: Array<{ title: string; image: string; href: string; is_featured?: boolean }>;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update the guide
    const guideResult = await client.query(`
      UPDATE guides 
      SET title = $1, intro = $2, youtube_url = $3, cover_image = $4, is_public = $5, is_featured = $6, sort_order = $7, guide_type = $8, updated_at = CURRENT_TIMESTAMP 
      WHERE slug = $9 
      RETURNING id
    `, [guideData.title, guideData.intro, guideData.youtubeUrl || null, guideData.coverImage || null, guideData.isPublic !== undefined ? guideData.isPublic : true, guideData.isFeatured !== undefined ? guideData.isFeatured : false, guideData.sortOrder !== undefined ? guideData.sortOrder : 0, guideData.guideType || 'Look', slug]);
    
    if (guideResult.rows.length === 0) {
      throw new Error('Guide not found');
    }
    
    const guideId = guideResult.rows[0].id;
    
    // Delete existing videos
    await client.query('DELETE FROM guide_videos WHERE guide_id = $1', [guideId]);
    
    // Create new videos if provided
    console.log('=== DB UPDATE GUIDE ===');
    console.log('Guide ID:', guideId);
    console.log('Videos to insert:', guideData.videos);
    console.log('Videos length:', guideData.videos?.length || 0);
    
    if (guideData.videos && guideData.videos.length > 0) {
      console.log('Inserting videos...');
      for (let i = 0; i < guideData.videos.length; i++) {
        const video = guideData.videos[i];
        const youtubeUrl = video.platform === 'youtube' ? video.video_url : null;
        console.log(`Inserting video ${i + 1}:`, video);
        await client.query(`
          INSERT INTO guide_videos (guide_id, platform, video_url, youtube_url, title, is_primary, sort_order) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [guideId, video.platform, video.video_url, youtubeUrl, video.title || null, video.is_primary || false, i]);
      }
      console.log('All videos inserted successfully');
    } else {
      console.log('No videos to insert (videos array is empty or undefined)');
    }
    
    // Delete existing items
    console.log('Deleting existing items for guide_id:', guideId);
    const deleteResult = await client.query('DELETE FROM productos WHERE guide_id = $1', [guideId]);
    console.log('Deleted items count:', deleteResult.rowCount);
    
    // Create new items
    console.log('=== DB UPDATE GUIDE ITEMS ===');
    console.log('Guide ID:', guideId);
    console.log('Items to insert:', guideData.items);
    console.log('Items length:', guideData.items.length);
    
    for (let i = 0; i < guideData.items.length; i++) {
      const item = guideData.items[i];
      console.log(`Inserting item ${i + 1}:`, item);
      try {
        const result = await client.query(`
          INSERT INTO productos (guide_id, titulo, imagen_url, enlace_url, destacado, sort_order, tipo, marketplace, activo, fecha_creacion, fecha_actualizacion) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `, [guideId, item.title, item.image, item.href, item.is_featured || false, i, 'afiliado', 'Guías', true]);
        console.log(`Successfully inserted item ${i + 1}, DB id:`, result.rows[0].id);
      } catch (itemError) {
        console.error(`Error inserting item ${i + 1}:`, itemError);
        throw itemError;
      }
    }
    console.log('All items inserted successfully');
    
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

export async function getFeaturedGuides() {
  const client = await pool.connect();
  
  try {
    const guidesResult = await client.query(`
      SELECT id, slug, title, intro, youtube_url, cover_image, is_public, is_featured, sort_order, guide_type, created_at, updated_at 
      FROM guides 
      WHERE is_public = TRUE AND is_featured = TRUE
      ORDER BY sort_order ASC, created_at DESC
    `);
    
    const guides = [];
    
    for (const guide of guidesResult.rows) {
      const itemsResult = await client.query(`
        SELECT titulo as title, imagen_url as image, enlace_url as href, destacado as is_featured 
        FROM productos 
        WHERE guide_id = $1 
        ORDER BY sort_order ASC, id ASC
      `, [guide.id]);

      const videosResult = await client.query(`
        SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
        FROM guide_videos 
        WHERE guide_id = $1 
        ORDER BY is_primary DESC, sort_order ASC, id ASC
      `, [guide.id]);
      
      // MIGRATION: If there's a youtube_url but no videos in guide_videos, migrate it
      let finalVideos = videosResult.rows;
      if (guide.youtube_url && guide.youtube_url.trim() && videosResult.rows.length === 0) {
        try {
          await client.query(`
            INSERT INTO guide_videos (guide_id, platform, video_url, youtube_url, title, is_primary, sort_order) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [guide.id, 'youtube', guide.youtube_url, guide.youtube_url, null, true, 0]);
          
          // Re-fetch videos after migration
          const migratedVideosResult = await client.query(`
            SELECT id, platform, video_url, youtube_url, title, is_primary, sort_order
            FROM guide_videos 
            WHERE guide_id = $1 
            ORDER BY is_primary DESC, sort_order ASC, id ASC
          `, [guide.id]);
          
          finalVideos = migratedVideosResult.rows;
        } catch (migrationError) {
          console.error(`Failed to migrate video for guide ${guide.slug}:`, migrationError);
        }
      }
      
      guides.push({
        slug: guide.slug,
        title: guide.title,
        intro: guide.intro,
        youtubeUrl: guide.youtube_url,
        coverImage: guide.cover_image,
        isPublic: guide.is_public,
        isFeatured: guide.is_featured,
        sortOrder: guide.sort_order,
        guideType: guide.guide_type,
        videos: finalVideos,
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

// Product Images Functions
export async function getProductImages(productId: number) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT id, image_url, alt_text, sort_order, is_primary, created_at
      FROM product_images 
      WHERE product_id = $1 
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `, [productId]);
    
    return result.rows;
  } finally {
    client.release();
  }
}

export async function addProductImage(productId: number, imageData: {
  image_url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // If this is set as primary, remove primary flag from other images
    if (imageData.is_primary) {
      await client.query(`
        UPDATE product_images SET is_primary = FALSE WHERE product_id = $1
      `, [productId]);
    }
    
    const result = await client.query(`
      INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, image_url, alt_text, sort_order, is_primary, created_at
    `, [
      productId, 
      imageData.image_url, 
      imageData.alt_text || null, 
      imageData.sort_order || 0, 
      imageData.is_primary || false
    ]);
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateProductImage(imageId: number, imageData: {
  image_url?: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current image to check product_id
    const currentResult = await client.query(`
      SELECT product_id FROM product_images WHERE id = $1
    `, [imageId]);
    
    if (currentResult.rows.length === 0) {
      throw new Error('Image not found');
    }
    
    const productId = currentResult.rows[0].product_id;
    
    // If this is set as primary, remove primary flag from other images of same product
    if (imageData.is_primary) {
      await client.query(`
        UPDATE product_images SET is_primary = FALSE 
        WHERE product_id = $1 AND id != $2
      `, [productId, imageId]);
    }
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let valueIndex = 1;
    
    if (imageData.image_url !== undefined) {
      updates.push(`image_url = $${valueIndex}`);
      values.push(imageData.image_url);
      valueIndex++;
    }
    
    if (imageData.alt_text !== undefined) {
      updates.push(`alt_text = $${valueIndex}`);
      values.push(imageData.alt_text);
      valueIndex++;
    }
    
    if (imageData.sort_order !== undefined) {
      updates.push(`sort_order = $${valueIndex}`);
      values.push(imageData.sort_order);
      valueIndex++;
    }
    
    if (imageData.is_primary !== undefined) {
      updates.push(`is_primary = $${valueIndex}`);
      values.push(imageData.is_primary);
      valueIndex++;
    }
    
    if (updates.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(imageId);
    
    const result = await client.query(`
      UPDATE product_images 
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, image_url, alt_text, sort_order, is_primary, created_at
    `, values);
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteProductImage(imageId: number) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      DELETE FROM product_images WHERE id = $1
      RETURNING product_id
    `, [imageId]);
    
    return result.rowCount && result.rowCount > 0 ? result.rows[0] : null;
  } finally {
    client.release();
  }
}

export async function setImageAsPrimary(imageId: number) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get product_id for this image
    const imageResult = await client.query(`
      SELECT product_id FROM product_images WHERE id = $1
    `, [imageId]);
    
    if (imageResult.rows.length === 0) {
      throw new Error('Image not found');
    }
    
    const productId = imageResult.rows[0].product_id;
    
    // Remove primary flag from all other images of this product
    await client.query(`
      UPDATE product_images SET is_primary = FALSE WHERE product_id = $1
    `, [productId]);
    
    // Set this image as primary
    const result = await client.query(`
      UPDATE product_images SET is_primary = TRUE WHERE id = $1
      RETURNING id, image_url, alt_text, sort_order, is_primary, created_at
    `, [imageId]);
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Deal database functions
export async function getPublicDeals() {
  const client = await pool.connect();
  
  try {
    const dealsResult = await client.query(`
      SELECT id, slug, title, intro, cover_image, discount_percentage, is_public, sort_order, created_at, updated_at 
      FROM deals 
      WHERE is_public = TRUE
      ORDER BY sort_order ASC, created_at DESC
    `);
    
    const deals = [];
    
    for (const deal of dealsResult.rows) {
      const itemsResult = await client.query(`
        SELECT id, title, image_url, href, original_price, sale_price, discount_percentage, is_featured, sort_order
        FROM deal_items 
        WHERE deal_id = $1 
        ORDER BY sort_order ASC, id ASC
      `, [deal.id]);

      const videosResult = await client.query(`
        SELECT id, platform, video_url, title, is_primary, sort_order
        FROM deal_videos 
        WHERE deal_id = $1 
        ORDER BY is_primary DESC, sort_order ASC, id ASC
      `, [deal.id]);
      
      deals.push({
        slug: deal.slug,
        title: deal.title,
        intro: deal.intro,
        coverImage: deal.cover_image,
        discountPercentage: deal.discount_percentage,
        isPublic: deal.is_public,
        sortOrder: deal.sort_order,
        videos: videosResult.rows,
        items: itemsResult.rows,
        created_at: deal.created_at,
        updated_at: deal.updated_at
      });
    }
    
    return deals;
  } finally {
    client.release();
  }
}

export async function getAllDeals() {
  const client = await pool.connect();
  
  try {
    const dealsResult = await client.query(`
      SELECT id, slug, title, intro, cover_image, discount_percentage, is_public, sort_order, created_at, updated_at 
      FROM deals 
      ORDER BY sort_order ASC, created_at DESC
    `);
    
    const deals = [];
    
    for (const deal of dealsResult.rows) {
      const itemsResult = await client.query(`
        SELECT id, title, image_url, href, original_price, sale_price, discount_percentage, is_featured, sort_order
        FROM deal_items 
        WHERE deal_id = $1 
        ORDER BY sort_order ASC, id ASC
      `, [deal.id]);

      const videosResult = await client.query(`
        SELECT id, platform, video_url, title, is_primary, sort_order
        FROM deal_videos 
        WHERE deal_id = $1 
        ORDER BY is_primary DESC, sort_order ASC, id ASC
      `, [deal.id]);
      
      deals.push({
        slug: deal.slug,
        title: deal.title,
        intro: deal.intro,
        coverImage: deal.cover_image,
        discountPercentage: deal.discount_percentage,
        isPublic: deal.is_public,
        sortOrder: deal.sort_order,
        videos: videosResult.rows,
        items: itemsResult.rows,
        created_at: deal.created_at,
        updated_at: deal.updated_at
      });
    }
    
    return deals;
  } finally {
    client.release();
  }
}

export async function getDealBySlug(slug: string) {
  const client = await pool.connect();
  
  try {
    const dealResult = await client.query(`
      SELECT id, slug, title, intro, cover_image, discount_percentage, is_public, sort_order, created_at, updated_at 
      FROM deals 
      WHERE slug = $1
    `, [slug]);
    
    if (dealResult.rows.length === 0) {
      return null;
    }
    
    const deal = dealResult.rows[0];
    
    const itemsResult = await client.query(`
      SELECT id, title, image_url, href, original_price, sale_price, discount_percentage, is_featured, sort_order
      FROM deal_items 
      WHERE deal_id = $1 
      ORDER BY sort_order ASC, id ASC
    `, [deal.id]);

    const videosResult = await client.query(`
      SELECT id, platform, video_url, title, is_primary, sort_order
      FROM deal_videos 
      WHERE deal_id = $1 
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `, [deal.id]);
    
    return {
      slug: deal.slug,
      title: deal.title,
      intro: deal.intro,
      coverImage: deal.cover_image,
      discountPercentage: deal.discount_percentage,
      isPublic: deal.is_public,
      sortOrder: deal.sort_order,
      videos: videosResult.rows,
      items: itemsResult.rows,
      created_at: deal.created_at,
      updated_at: deal.updated_at
    };
  } finally {
    client.release();
  }
}

export async function createDeal(dealData: {
  slug: string;
  title: string;
  intro: string;
  coverImage?: string;
  discountPercentage?: number;
  isPublic?: boolean;
  sortOrder?: number;
  videos?: Array<{ platform: string; video_url: string; title?: string; is_primary?: boolean }>;
  items: Array<{ title: string; image_url: string; href: string; original_price?: number; sale_price?: number; discount_percentage?: number; is_featured?: boolean }>;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create the deal
    const dealResult = await client.query(`
      INSERT INTO deals (slug, title, intro, cover_image, discount_percentage, is_public, sort_order) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id
    `, [dealData.slug, dealData.title, dealData.intro, dealData.coverImage || null, dealData.discountPercentage || null, dealData.isPublic !== undefined ? dealData.isPublic : true, dealData.sortOrder || 0]);
    
    const dealId = dealResult.rows[0].id;
    
    // Create the deal videos if provided
    if (dealData.videos && dealData.videos.length > 0) {
      for (let i = 0; i < dealData.videos.length; i++) {
        const video = dealData.videos[i];
        await client.query(`
          INSERT INTO deal_videos (deal_id, platform, video_url, title, is_primary, sort_order) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [dealId, video.platform, video.video_url, video.title || null, video.is_primary || false, i]);
      }
    }
    
    // Create the deal items
    for (let i = 0; i < dealData.items.length; i++) {
      const item = dealData.items[i];
      await client.query(`
        INSERT INTO deal_items (deal_id, title, image_url, href, original_price, sale_price, discount_percentage, is_featured, sort_order) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [dealId, item.title, item.image_url, item.href, item.original_price || null, item.sale_price || null, item.discount_percentage || null, item.is_featured || false, i]);
    }
    
    await client.query('COMMIT');
    return { success: true, id: dealId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateDeal(slug: string, dealData: {
  title: string;
  intro: string;
  coverImage?: string;
  discountPercentage?: number;
  isPublic?: boolean;
  sortOrder?: number;
  videos?: Array<{ platform: string; video_url: string; title?: string; is_primary?: boolean }>;
  items: Array<{ title: string; image_url: string; href: string; original_price?: number; sale_price?: number; discount_percentage?: number; is_featured?: boolean }>;
}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update the deal
    const dealResult = await client.query(`
      UPDATE deals 
      SET title = $1, intro = $2, cover_image = $3, discount_percentage = $4, is_public = $5, sort_order = $6, updated_at = CURRENT_TIMESTAMP 
      WHERE slug = $7 
      RETURNING id
    `, [dealData.title, dealData.intro, dealData.coverImage || null, dealData.discountPercentage || null, dealData.isPublic !== undefined ? dealData.isPublic : true, dealData.sortOrder !== undefined ? dealData.sortOrder : 0, slug]);
    
    if (dealResult.rows.length === 0) {
      throw new Error('Deal not found');
    }
    
    const dealId = dealResult.rows[0].id;
    
    // Delete existing videos
    await client.query('DELETE FROM deal_videos WHERE deal_id = $1', [dealId]);
    
    // Create new videos if provided
    if (dealData.videos && dealData.videos.length > 0) {
      for (let i = 0; i < dealData.videos.length; i++) {
        const video = dealData.videos[i];
        await client.query(`
          INSERT INTO deal_videos (deal_id, platform, video_url, title, is_primary, sort_order) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [dealId, video.platform, video.video_url, video.title || null, video.is_primary || false, i]);
      }
    }
    
    // Delete existing items
    await client.query('DELETE FROM deal_items WHERE deal_id = $1', [dealId]);
    
    // Create new items
    for (let i = 0; i < dealData.items.length; i++) {
      const item = dealData.items[i];
      await client.query(`
        INSERT INTO deal_items (deal_id, title, image_url, href, original_price, sale_price, discount_percentage, is_featured, sort_order) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [dealId, item.title, item.image_url, item.href, item.original_price || null, item.sale_price || null, item.discount_percentage || null, item.is_featured || false, i]);
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

export async function deleteDeal(slug: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query('DELETE FROM deals WHERE slug = $1', [slug]);
    return result.rowCount && result.rowCount > 0;
  } finally {
    client.release();
  }
}
