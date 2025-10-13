const { query } = require('../config/database');

class Product {
  static async initTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(20) NOT NULL DEFAULT 'afiliado', -- 'afiliado' | 'propio'
        marketplace VARCHAR(50), -- Amazon | LTK | Walmart | TikTok | Pinterest | Instagram | Propio
        enlace_url TEXT, -- URL externa (afiliado) o interna
        imagen_url TEXT,
        precio NUMERIC(12,2),
        moneda VARCHAR(3),
        destacado BOOLEAN DEFAULT false,
        activo BOOLEAN DEFAULT true,
        creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS productos_categorias (
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,
        PRIMARY KEY (producto_id, categoria_id)
      );

      CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
      CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo);
      CREATE INDEX IF NOT EXISTS idx_productos_marketplace ON productos(marketplace);
      CREATE INDEX IF NOT EXISTS idx_productos_fecha ON productos(fecha_creacion DESC);
    `;

    await query(sql);
    console.log('✅ Tablas productos/categorias creadas/verificadas exitosamente');
  }

  static async create(data) {
    const {
      titulo,
      descripcion = null,
      tipo = 'afiliado',
      marketplace = null,
      enlace_url = null,
      imagen_url = null,
      precio = null,
      moneda = null,
      destacado = false,
      activo = true,
      creado_por = null,
      categorias = []
    } = data;

    const res = await query(
      `INSERT INTO productos 
        (titulo, descripcion, tipo, marketplace, enlace_url, imagen_url, precio, moneda, destacado, activo, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [titulo, descripcion, tipo, marketplace, enlace_url, imagen_url, precio, moneda, destacado, activo, creado_por]
    );
    const product = res.rows[0];
    if (categorias && Array.isArray(categorias) && categorias.length) {
      await Product.setCategories(product.id, categorias);
    }
    return await Product.findById(product.id);
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (k === 'categorias') continue; // manejar aparte
      fields.push(`${k} = $${idx++}`);
      values.push(v);
    }
    values.push(id);
    if (fields.length) {
      await query(
        `UPDATE productos SET ${fields.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $${idx}`,
        values
      );
    }
    if (Array.isArray(data.categorias)) {
      await Product.setCategories(id, data.categorias);
    }
    return await Product.findById(id);
  }

  static async list({ activo = true, limit = 100, offset = 0, marketplace = null, category = null } = {}) {
    const conds = [];
    const params = [];
    let i = 1;
    if (activo !== null && activo !== undefined) { conds.push(`p.activo = $${i++}`); params.push(!!activo); }
    if (marketplace) { conds.push(`LOWER(p.marketplace) = LOWER($${i++})`); params.push(marketplace); }
    if (category) { conds.push(`EXISTS (SELECT 1 FROM productos_categorias pc2 JOIN categorias c2 ON c2.id = pc2.categoria_id WHERE pc2.producto_id = p.id AND LOWER(c2.nombre) = LOWER($${i++}))`); params.push(category); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `
      SELECT p.*, COALESCE(array_agg(c.nombre ORDER BY c.nombre) FILTER (WHERE c.id IS NOT NULL), '{}') AS categorias
      FROM productos p
      LEFT JOIN productos_categorias pc ON pc.producto_id = p.id
      LEFT JOIN categorias c ON c.id = pc.categoria_id
      ${where}
      GROUP BY p.id
      ORDER BY p.fecha_creacion DESC
      LIMIT ${Number(limit) || 100} OFFSET ${Number(offset) || 0}
    `;
    const res = await query(sql, params);
    return res.rows;
  }

  static async findById(id) {
    const res = await query(`
      SELECT p.*, COALESCE(array_agg(c.nombre ORDER BY c.nombre) FILTER (WHERE c.id IS NOT NULL), '{}') AS categorias
      FROM productos p
      LEFT JOIN productos_categorias pc ON pc.producto_id = p.id
      LEFT JOIN categorias c ON c.id = pc.categoria_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);
    return res.rows[0] || null;
  }

  static async remove(id) {
    await query('DELETE FROM productos WHERE id = $1', [id]);
    return true;
  }

  // Upsert categories and set associations
  static async setCategories(productId, categories) {
    const names = (categories || [])
      .map((s) => String(s || '').trim())
      .filter((s) => s.length > 0);
    if (!names.length) {
      await query('DELETE FROM productos_categorias WHERE producto_id = $1', [productId]);
      return [];
    }
    // Insert categories if not exist
    const unique = Array.from(new Set(names));
    const insertedIds = [];
    for (const name of unique) {
      try {
        const ins = await query('INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id', [name]);
        insertedIds.push(ins.rows[0].id);
      } catch (e) {
        // fallback: get existing id
        const sel = await query('SELECT id FROM categorias WHERE nombre = $1', [name]);
        if (sel.rows[0]) insertedIds.push(sel.rows[0].id);
      }
    }
    // Replace associations
    await query('DELETE FROM productos_categorias WHERE producto_id = $1', [productId]);
    for (const cid of insertedIds) {
      await query('INSERT INTO productos_categorias (producto_id, categoria_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [productId, cid]);
    }
    return insertedIds;
  }

  static async listCategories() {
    const res = await query('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
    return res.rows;
  }
}

module.exports = Product;
