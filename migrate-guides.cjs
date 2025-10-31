const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: 'well',
  password: '874494Aa.',
  host: 'postgres-db',
  port: 5432,
  database: 'eclectiquebykmc_db'
});

// Static guides data to migrate
const staticGuides = [
  {
    slug: "fall-essentials",
    title: "5 Fall Essentials",
    intro: "Quick and versatile selection for cool weather.",
    items: [
      {
        title: "Long cardigan",
        image: "/images/guides/cardigan.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
      {
        title: "Leather ankle boots",
        image: "/images/guides/boots.webp", 
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
      {
        title: "Straight jeans",
        image: "/images/guides/jeans.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
      {
        title: "Knit scarf",
        image: "/images/guides/scarf.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
      {
        title: "Structured blazer",
        image: "/images/guides/blazer.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
    ],
  },
  {
    slug: "work-from-home",
    title: "Work From Home Look",
    intro: "Comfortable yet professional for video calls.",
    items: [
      {
        title: "Satin blouse",
        image: "/images/guides/blouse.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
      {
        title: "Elevated jogger pants",
        image: "/images/guides/joggers.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
      {
        title: "Minimalist slippers",
        image: "/images/guides/slippers.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
    ],
  },
  {
    slug: "date-night",
    title: "Date Night",
    intro: "Elegant and sophisticated for special occasions.",
    items: [
      {
        title: "Black midi dress",
        image: "/images/guides/dress.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
      {
        title: "Nude heels",
        image: "/images/guides/heels.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
      {
        title: "Small handbag",
        image: "/images/guides/purse.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
      {
        title: "Delicate necklace",
        image: "/images/guides/necklace.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
    ],
  },
  {
    slug: "weekend-casual",
    title: "Weekend Casual",
    intro: "Relaxed yet stylish for days off.",
    items: [
      {
        title: "Oversized hoodie",
        image: "/images/guides/hoodie.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
      {
        title: "High-waisted leggings",
        image: "/images/guides/leggings.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
      {
        title: "White sneakers",
        image: "/images/guides/sneakers.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
    ],
  },
  {
    slug: "spring-transition",
    title: "Spring Transition",
    intro: "Light pieces for the changing season.",
    items: [
      {
        title: "Denim jacket",
        image: "/images/guides/denim-jacket.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
      {
        title: "Floral dress",
        image: "/images/guides/floral-dress.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
      {
        title: "Flat sandals",
        image: "/images/guides/sandals.webp",
        href: "https://www.shopltk.com/explore/Karina_M_Cruz?tab=posts",
      },
      {
        title: "Tote bag",
        image: "/images/guides/tote.webp",
        href: "https://www.amazon.com/shop/karina.m.cruzugccreator?ref_=cm_sw_r_apin_aipsfshop_04BNEZ870FWHB6CR9892&language=en-US",
      },
    ],
  },
];

async function migrateGuides() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration of guides to eclectiquebykmc_db...');
    
    for (const guide of staticGuides) {
      await client.query('BEGIN');
      
      try {
        // Insert guide
        const guideResult = await client.query(`
          INSERT INTO guides (slug, title, intro) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, [guide.slug, guide.title, guide.intro]);
        
        const guideId = guideResult.rows[0].id;
        console.log(`✅ Created guide: ${guide.title} (ID: ${guideId})`);
        
        // Insert guide items
        for (const item of guide.items) {
          await client.query(`
            INSERT INTO guide_items (guide_id, title, image_url, href) 
            VALUES ($1, $2, $3, $4)
          `, [guideId, item.title, item.image, item.href]);
        }
        
        console.log(`   📦 Added ${guide.items.length} items to guide`);
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error migrating guide ${guide.title}:`, error.message);
      }
    }
    
    // Verify migration
    const guidesResult = await client.query('SELECT COUNT(*) as count FROM guides');
    const itemsResult = await client.query('SELECT COUNT(*) as count FROM guide_items');
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Guides created: ${guidesResult.rows[0].count}`);
    console.log(`   Items created: ${itemsResult.rows[0].count}`);
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateGuides();