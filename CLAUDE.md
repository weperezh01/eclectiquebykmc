# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Éclectique by KMC Landing Site
- **Development**: `npm run dev` - Vite dev server with hot reload on port 5177
- **Build**: `npm run build` - Production build using Remix Vite
- **Start**: `npm run start` - Production server using remix-serve
- **Watch**: `npm run watch` - Nodemon watcher for development with auto rebuild/restart
- **Type check**: `npm run typecheck` - TypeScript validation
- **Lint**: `npm run lint` - ESLint with caching

### Docker Deployment
- **Build and deploy**: `cd docker-stack && docker compose up -d --build remix-landing-eclectiquebykmc`
- **View logs**: `docker compose logs -f remix-landing-eclectiquebykmc`

## Architecture Overview

This is a **Spanish-language affiliate marketing landing site** for "Éclectique by KMC" - a curated collection of fashion and lifestyle products.

### Key Features
- **Spanish content**: All UI text, routes, and content are in Spanish
- **Affiliate marketing**: Amazon Storefront integration with affiliate links
- **Social media integration**: Links to Instagram, TikTok, Pinterest, LTK, Facebook
- **Product curation**: Featured items, guides, and marketplace integration
- **Responsive design**: Mobile-first TailwindCSS implementation

### Technology Stack
- **Remix v2**: File-based routing with Vite bundling and TypeScript
- **Styling**: TailwindCSS with custom color scheme (primary: #1a1a1a, accent: #b48b57)
- **Icons**: React Icons and Lucide React
- **Server**: remix-serve for production deployment
- **Development**: Nodemon for auto-reloading during development

### Content Architecture

**Centralized Content Management**:
- All editable content lives in `app/content/links.ts`
- Social media URLs, featured products, affiliate links, marketplace info
- Guides with slug-based routing and product collections
- Structured as typed constants for type safety

**Content Types**:
- `social`: Social media platform URLs (Amazon, LTK, TikTok, Pinterest, Instagram, Facebook)
- `featured`: Homepage featured products with images, titles, links, labels
- `affiliates`: Affiliate product grid with images, titles, links, notes
- `marketplaces`: Platform showcase with logos, links, descriptions
- `guides`: Product guides with slug routing and item collections

### File Structure

```
app/
├── components/           # Reusable UI components
│   ├── Card.tsx         # Generic product card component
│   ├── Grid.tsx         # Responsive grid container
│   ├── Hero.tsx         # Homepage hero section with dual CTAs
│   ├── LogoLinks.tsx    # Marketplace logo grid
│   ├── ContactForm.tsx  # Contact form with validation
│   └── Disclosure.tsx   # Affiliate disclosure notice
├── content/
│   └── links.ts         # Centralized content and configuration
├── data/
│   ├── affiliates.ts    # Affiliate product data
│   ├── links.ts         # Additional link collections
│   └── products.ts      # Product data structures
├── routes/              # File-based routing (Spanish URLs)
│   ├── _index.tsx       # Homepage
│   ├── afiliados._index.tsx    # Affiliate products page
│   ├── marketplaces._index.tsx # Social platforms showcase
│   ├── guias._index.tsx        # Guides listing
│   ├── guias.$slug.tsx         # Individual guide pages
│   ├── sobre._index.tsx        # About KMC page
│   ├── contacto._index.tsx     # Contact page
│   ├── privacy._index.tsx      # Privacy policy
│   └── terms._index.tsx        # Terms of service
├── shared/
│   ├── Navbar.tsx       # Site navigation
│   └── Footer.tsx       # Site footer
└── types/
    ├── affiliate.ts     # Affiliate product types
    └── product.ts       # Product data types
```

### Route Architecture

**Spanish URL Structure**:
- `/` - Homepage with hero, featured products, social links
- `/afiliados` - Affiliate products grid
- `/marketplaces` - Social media platforms showcase
- `/guias` - Product guides listing
- `/guias/[slug]` - Individual guide detail pages
- `/sobre` - About KMC bio page
- `/contacto` - Contact form and direct links
- `/privacy` - Privacy policy
- `/terms` - Terms of service

**SEO & Meta**:
- Spanish meta titles and descriptions
- Open Graph and Twitter card support
- Canonical URLs for SEO
- Default OG image at `/images/og-default.svg`

### Development Patterns

**Content Updates**:
- Edit `app/content/links.ts` to update all site content
- Images stored in `public/images/` with organized subdirectories
- Type-safe content structure prevents runtime errors

**Component Architecture**:
- Functional components with TypeScript interfaces
- Reusable card and grid systems for product display
- Responsive design patterns throughout
- Clean separation of content and presentation

**Development Workflow**:
1. Start development server: `npm run dev` (port 5177)
2. Edit content in `app/content/links.ts`
3. Add images to appropriate `public/images/` subdirectories
4. Use `npm run watch` for auto-reload during active development
5. Deploy via Docker Compose in parent docker-stack directory

### Deployment Notes

**Docker Integration**:
- Containerized as part of larger Well Technologies stack
- Caddy reverse proxy routes `eclectiquebykmc.com` to port 3010
- Production builds served via remix-serve
- External port mapping handled by docker-stack configuration

**Environment**:
- Node.js >= 20.0.0 required
- No external database dependencies
- Static content and images served from public directory
- Spanish language default (lang="es" in root.tsx)