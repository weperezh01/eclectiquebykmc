const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authenticate, requireAdmin } = require('../middleware/auth');
const Product = require('../models/Product');

const router = express.Router();

// Rate limiting
const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 300,
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});

// Listar productos (público)
router.get('/', readLimiter, async (req, res) => {
  try {
    const activo = req.query.activo === undefined ? true : (req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : null);
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const marketplace = req.query.marketplace || null;
    const category = req.query.category || null;
    const items = await Product.list({ activo, limit, offset, marketplace, category });
    res.json(items);
  } catch (e) {
    console.error('Error listando productos:', e);
    res.status(500).json({ success: false, message: 'Error listando productos' });
  }
});

// Crear producto (admin)
router.post('/', authenticate, requireAdmin, writeLimiter, async (req, res) => {
  try {
    const { titulo, descripcion, tipo, marketplace, enlace_url, imagen_url, precio, moneda, destacado, activo, categorias } = req.body || {};

    if (!titulo || String(titulo).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Título es obligatorio' });
    }

    if (tipo && !['afiliado', 'propio'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo inválido' });
    }

    const created = await Product.create({
      titulo: String(titulo).trim(),
      descripcion: descripcion ? String(descripcion).trim() : null,
      tipo: tipo || 'afiliado',
      marketplace: marketplace ? String(marketplace).trim() : null,
      enlace_url: enlace_url ? String(enlace_url).trim() : null,
      imagen_url: imagen_url ? String(imagen_url).trim() : null,
      precio: precio !== undefined && precio !== null && String(precio).length ? Number(precio) : null,
      moneda: moneda ? String(moneda).trim().toUpperCase() : null,
      destacado: Boolean(destacado),
      activo: activo === undefined ? true : Boolean(activo),
      creado_por: req.user?.id || null,
      categorias: Array.isArray(categorias) ? categorias : [],
    });

    res.status(201).json(created);
  } catch (e) {
    console.error('Error creando producto:', e);
    res.status(500).json({ success: false, message: 'Error creando producto' });
  }
});

// Obtener un producto por ID (admin o público si activo)
router.get('/:id', readLimiter, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await Product.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json(item);
  } catch (e) {
    console.error('Error obteniendo producto:', e);
    res.status(500).json({ success: false, message: 'Error obteniendo producto' });
  }
});

// Actualizar producto (admin)
router.put('/:id', authenticate, requireAdmin, writeLimiter, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowed = ['titulo','descripcion','tipo','marketplace','enlace_url','imagen_url','precio','moneda','destacado','activo','categorias'];
    const data = {};
    for (const k of allowed) {
      if (k in req.body) data[k] = req.body[k];
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'Sin cambios' });
    }
    const updated = await Product.update(id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json(updated);
  } catch (e) {
    console.error('Error actualizando producto:', e);
    res.status(500).json({ success: false, message: 'Error actualizando producto' });
  }
});

// Eliminar producto (admin)
router.delete('/:id', authenticate, requireAdmin, writeLimiter, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await Product.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });
    // intentar borrar imagen local si es /uploads/products/
    if (item.imagen_url && item.imagen_url.startsWith('/uploads/products/')) {
      const p = path.join('/app', item.imagen_url);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    }
    await Product.remove(id);
    res.json({ success: true });
  } catch (e) {
    console.error('Error eliminando producto:', e);
    res.status(500).json({ success: false, message: 'Error eliminando producto' });
  }
});

// Configuración de uploads para imágenes de productos
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = '/app/uploads/products';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `product_${req.params.id}_${Date.now()}${ext}`;
    cb(null, fileName);
  }
});
const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo imágenes'));
  }
});

// Subir imagen de producto (admin)
router.post('/:id/image', authenticate, requireAdmin, productUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Archivo requerido' });
    const id = Number(req.params.id);
    const item = await Product.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'No encontrado' });
    // borrar imagen anterior si era local
    if (item.imagen_url && item.imagen_url.startsWith('/uploads/products/')) {
      const p = path.join('/app', item.imagen_url);
      if (fs.existsSync(p)) { try { fs.unlinkSync(p); } catch {} }
    }
    const url = `/uploads/products/${req.file.filename}`;
    const updated = await Product.update(id, { imagen_url: url });
    res.json(updated);
  } catch (e) {
    console.error('Error subiendo imagen de producto:', e);
    res.status(500).json({ success: false, message: 'Error subiendo imagen' });
  }
});

module.exports = router;
// Subruta para categorías (listado)
router.get('/_meta/categories', readLimiter, async (req, res) => {
  try {
    const cats = await Product.listCategories();
    res.json(cats);
  } catch (e) {
    console.error('Error listando categorías:', e);
    res.status(500).json({ success: false, message: 'Error listando categorías' });
  }
});
