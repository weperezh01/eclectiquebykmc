import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool, getProductImages } from "../lib/db";

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { id } = params;
    
    if (!id) {
      return json({ error: "Product ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          id,
          titulo as title,
          descripcion as description,
          tipo as type,
          marketplace,
          enlace_url as link_url,
          imagen_url as image_url,
          precio as price,
          moneda as currency,
          destacado as featured,
          activo as active,
          categorias,
          fecha_creacion as created_at,
          fecha_actualizacion as updated_at
        FROM productos 
        WHERE id = $1 AND activo = true
      `, [id]);

      if (result.rows.length === 0) {
        return json({ error: "Product not found" }, { status: 404 });
      }

      const product = result.rows[0];
      
      // Get additional images for this product
      const images = await getProductImages(product.id);
      
      // Add images to product response
      product.images = images;
      
      return json(product);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  try {
    const { id } = params;
    const method = request.method;
    
    if (!id) {
      return json({ error: "Product ID is required" }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      if (method === "PUT") {
        const updatedData = await request.json();
        
        console.log('=== API PRODUCTS PUT REQUEST ===');
        console.log('Product ID:', id);
        console.log('Updated data received:', updatedData);
        
        // Build dynamic SET clause based on provided fields
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (updatedData.titulo !== undefined) {
          setClauses.push(`titulo = $${paramIndex++}`);
          values.push(updatedData.titulo);
        }
        
        if (updatedData.descripcion !== undefined) {
          setClauses.push(`descripcion = $${paramIndex++}`);
          values.push(updatedData.descripcion);
        }
        
        if (updatedData.tipo !== undefined) {
          setClauses.push(`tipo = $${paramIndex++}`);
          values.push(updatedData.tipo);
        }
        
        if (updatedData.marketplace !== undefined) {
          setClauses.push(`marketplace = $${paramIndex++}`);
          values.push(updatedData.marketplace);
        }
        
        if (updatedData.enlace_url !== undefined) {
          setClauses.push(`enlace_url = $${paramIndex++}`);
          values.push(updatedData.enlace_url);
        }
        
        if (updatedData.imagen_url !== undefined) {
          setClauses.push(`imagen_url = $${paramIndex++}`);
          values.push(updatedData.imagen_url);
        }
        
        if (updatedData.precio !== undefined) {
          setClauses.push(`precio = $${paramIndex++}`);
          values.push(updatedData.precio);
        }
        
        if (updatedData.moneda !== undefined) {
          setClauses.push(`moneda = $${paramIndex++}`);
          values.push(updatedData.moneda);
        }
        
        if (updatedData.destacado !== undefined) {
          setClauses.push(`destacado = $${paramIndex++}`);
          values.push(updatedData.destacado);
        }
        
        if (updatedData.activo !== undefined) {
          setClauses.push(`activo = $${paramIndex++}`);
          values.push(updatedData.activo);
        }
        
        if (updatedData.categorias !== undefined) {
          setClauses.push(`categorias = $${paramIndex++}`);
          values.push(updatedData.categorias);
        }
        
        if (setClauses.length === 0) {
          return json({ error: "No fields to update" }, { status: 400 });
        }
        
        setClauses.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
        values.push(id);
        
        const query = `
          UPDATE productos 
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING id
        `;
        
        console.log('SQL Query:', query);
        console.log('Values:', values);
        
        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          return json({ error: "Product not found" }, { status: 404 });
        }
        
        console.log('Product updated successfully:', result.rows[0]);
        return json({ success: true });
        
      } else if (method === "DELETE") {
        console.log('=== API PRODUCTS DELETE REQUEST ===');
        console.log('Product ID:', id);
        
        const result = await client.query(
          'DELETE FROM productos WHERE id = $1 RETURNING id',
          [id]
        );
        
        if (result.rows.length === 0) {
          return json({ error: "Product not found" }, { status: 404 });
        }
        
        console.log('Product deleted successfully:', result.rows[0]);
        return json({ success: true });
      }
      
      return json({ error: "Method not allowed" }, { status: 405 });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('Error in product action:', error);
    return json({ error: error.message || "Server error" }, { status: 500 });
  }
}