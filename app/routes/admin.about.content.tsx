import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT bio, image_url FROM about_content ORDER BY updated_at DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      // Fallback to default content if nothing in database
      return json({
        bio: "¡Hola! Soy Karina, una apasionada de la moda y el estilo personal. A través de Éclectique by KMC, comparto mis looks favoritos y descubrimientos de moda que pueden inspirarte a crear tu propio estilo único. Me encanta encontrar piezas versátiles que se adapten a diferentes ocasiones y presupuestos.",
        image: "/images/kmc.webp"
      });
    }
    
    return json({
      bio: result.rows[0].bio,
      image: result.rows[0].image_url
    });
  } finally {
    client.release();
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = await request.json();
    
    if (!data.bio || !data.bio.trim()) {
      return json({ error: 'Bio is required' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Update or insert the content
      await client.query(`
        INSERT INTO about_content (bio, image_url, updated_at) 
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [data.bio, data.image || '/images/kmc.webp']);
      
      console.log('About content updated in database:', data);
      
      return json({ 
        success: true, 
        message: 'Content saved successfully',
        data 
      });
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error updating about content:', error);
    return json({ error: 'Failed to save content' }, { status: 500 });
  }
};