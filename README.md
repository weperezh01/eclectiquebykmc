# Éclectique by KMC — Landing (Remix)

## Contenido editable

Edita `app/content/links.ts` para cambiar:
- `social`: URLs de Amazon Storefront, LTK, TikTok, Pinterest, Instagram
- `featured`: items destacados de la Home (imagen, título, enlace, label)
- `affiliates`: productos de la página Afiliados (imagen, título, enlace, nota)
- `marketplaces`: logos, enlaces y blurb del mural de Marketplaces
- `guides`: lista de guías; cada guía tiene `slug`, `title`, `intro` e `items` (imagen, título y enlace)

Imágenes: coloca archivos en `public/images/...` y referencia sus rutas.

## Páginas
- Home (`app/routes/_index.tsx`): Hero con doble CTA + Destacados + Encuéntranos + Disclosure
- Afiliados (`app/routes/afiliados._index.tsx`): grid desde `content.affiliates`
- Marketplaces (`app/routes/marketplaces._index.tsx`): mural con `content.marketplaces`
- Sobre KMC (`app/routes/sobre._index.tsx`): bio + imagen
- Guías (`app/routes/guias._index.tsx`) y detalle (`app/routes/guias.$slug.tsx`)
- Contacto (`app/routes/contacto._index.tsx`): formulario básico + enlaces directos
- Privacidad (`app/routes/privacy._index.tsx`) y Términos (`app/routes/terms._index.tsx`)

## Componentes
- `components/Hero.tsx` — Hero con doble CTA
- `components/Card.tsx` — Tarjeta genérica para productos
- `components/Grid.tsx` — Contenedor de grilla responsive
- `components/LogoLinks.tsx` — Lista de logos con enlaces
- `components/Disclosure.tsx` — Aviso corto
- `components/ContactForm.tsx` — Formulario con validación mínima + mailto fallback

## SEO
- Metadatos OG/Twitter por página (usa `og-default.svg`).

## Despliegue
Construye y levanta el servicio:

```
cd docker-stack
# build + up sólo del sitio
docker compose up -d --build remix-landing-eclectiquebykmc
```

Caddy en el host ya enruta `eclectiquebykmc.com` a `127.0.0.1:3010`.

