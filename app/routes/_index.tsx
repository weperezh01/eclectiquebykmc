import type { MetaFunction } from "@remix-run/node";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeroEclectique from "../components/HeroEclectique";
import Grid from "../components/Grid";
import Card from "../components/Card";
import LogoLinks from "../components/LogoLinks";
import Disclosure from "../components/Disclosure";
import { content, HOME_COPY, ogImage } from "../content/links";

export const meta: MetaFunction = () => ([
  { title: "Éclectique by KMC | Curated pieces for daily use" },
  { name: "description", content: "Discover our curated selection of beauty, fashion and accessories to elevate your daily style. Shopping with affiliate links." },
  { property: "og:title", content: "Your curated daily style | Éclectique by KMC" },
  { property: "og:description", content: "Handpicked beauty, fashion and accessories for your everyday." },
  { property: "og:type", content: "website" },
  { property: "og:image", content: ogImage },
]);

type Producto = {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: 'afiliado' | 'propio';
  marketplace?: string | null;
  enlace_url?: string | null;
  imagen_url?: string | null;
  precio?: number | null;
  moneda?: string | null;
  destacado?: boolean;
  fecha_creacion?: string;
  categorias?: string[];
};

export default function Index() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products?activo=true&limit=60');
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setItems(data);
      } catch (e: any) {
        setError(e?.message || 'Error loading products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const destacados = useMemo(() => {
    const d = items.filter((p) => p.destacado).slice(0, 8);
    if (d.length > 0) return d;
    // fallback: últimos agregados
    return items.slice(0, 8);
  }, [items]);

  const ultimos = useMemo(() => {
    // mostrar últimos propios/afiliados mezclados
    return items.slice(0, 8);
  }, [items]);

  const getStep = useCallback(() => {
    const c = sliderRef.current;
    if (!c) return 320; // fallback
    const first = c.querySelector('.slider-card') as HTMLElement | null;
    const gap = 16; // gap-4
    return (first?.offsetWidth || 300) + gap;
  }, []);

  const next = useCallback(() => {
    const c = sliderRef.current;
    if (!c) return;
    const step = getStep();
    const nearEnd = c.scrollLeft + c.clientWidth >= c.scrollWidth - 4;
    if (nearEnd) {
      c.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      c.scrollBy({ left: step, behavior: 'smooth' });
    }
  }, [getStep]);

  const prev = useCallback(() => {
    const c = sliderRef.current;
    if (!c) return;
    const step = getStep();
    const atStart = c.scrollLeft <= 0;
    if (atStart) {
      c.scrollTo({ left: c.scrollWidth, behavior: 'smooth' });
    } else {
      c.scrollBy({ left: -step, behavior: 'smooth' });
    }
  }, [getStep]);

  // Autoplay
  useEffect(() => {
    if (paused || items.length === 0) return;
    const id = setInterval(() => next(), 5000);
    return () => clearInterval(id);
  }, [paused, items.length, next]);

  return (
    <main className="min-h-screen flex flex-col">
      <HeroEclectique />

      {/* Featured slider */}
      <section id="featured-products" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl md:text-2xl font-bold">Explore now</h2>
            <div className="flex items-center gap-4 text-sm">
              <a href="/tiendas" className="text-gray-700 hover:underline">Shops</a>
              <a href="/afiliados" className="text-accent hover:underline">Affiliates</a>
            </div>
          </div>
          <div className="relative">
            {items.length > 3 ? (
              <>
                <button
                  aria-label="Previous"
                  onClick={prev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 p-2 shadow ring-1 ring-black/10 hover:bg-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button
                  aria-label="Next"
                  onClick={next}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 p-2 shadow ring-1 ring-black/10 hover:bg-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </>
            ) : null}
            <div
              aria-label="Product carousel"
              ref={sliderRef}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
            >
              {(items.slice(0, 12)).map((p) => (
                <div key={p.id} className="slider-card snap-start shrink-0 w-[260px] md:w-[300px]">
                  <Card
                    title={p.titulo}
                    image={p.imagen_url || "/images/aff/organizer.webp"}
                    href={p.enlace_url || '#'}
                    note={p.precio ? `${p.precio} ${p.moneda || ''}` : p.marketplace || undefined}
                    label={p.marketplace ? `Shop on ${p.marketplace}` : 'Shop'}
                    tags={[p.marketplace || ''].concat(p.categorias || []).filter(Boolean).slice(0, 3)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Featured */}
      <section className="bg-white text-gray-800">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl md:text-3xl font-bold">Featured</h2>
            <a href="/afiliados" className="text-sm text-accent hover:underline">View more</a>
          </div>

          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : destacados.length === 0 ? (
            <p className="text-sm text-gray-600">No featured items right now.</p>
          ) : (
            <Grid>
              {destacados.map((p) => (
                <Card
                  key={p.id}
                  title={p.titulo}
                  image={p.imagen_url || "/images/featured/organizer.webp"}
                  href={p.enlace_url || '#'}
                  note={p.precio ? `${p.precio} ${p.moneda || ''}` : p.marketplace || undefined}
                  label={p.marketplace ? `Shop on ${p.marketplace}` : 'Shop'}
                  tags={[p.marketplace || ''].concat(p.categorias || []).filter(Boolean).slice(0, 3)}
                />
              ))}
            </Grid>
          )}
        </div>
      </section>

      {/* CTA Reutilizable */}
      <section className="bg-neutral-50 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to elevate your style?</h2>
          <p className="text-lg text-gray-600 mb-8">Browse our complete curated selection</p>
          <a 
            href="#featured-products"
            className="inline-flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector('#featured-products');
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Shop the edit
          </a>
        </div>
      </section>

      {/* New arrivals */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl md:text-3xl font-bold">New arrivals</h2>
            <div className="flex items-center gap-4">
              <a href="/tiendas" className="text-sm text-gray-700 hover:underline">Shops</a>
              <a href="/afiliados" className="text-sm text-accent hover:underline">Affiliates</a>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : ultimos.length === 0 ? (
            <p className="text-sm text-gray-600">No new arrivals right now.</p>
          ) : (
            <Grid>
              {ultimos.map((p) => (
                <Card
                  key={p.id}
                  title={p.titulo}
                  image={p.imagen_url || "/images/aff/organizer.webp"}
                  href={p.enlace_url || '#'}
                  note={p.precio ? `${p.precio} ${p.moneda || ''}` : p.marketplace || undefined}
                  label={p.marketplace ? `Shop on ${p.marketplace}` : 'Shop'}
                  tags={[p.marketplace || ''].concat(p.categorias || []).filter(Boolean).slice(0, 3)}
                />
              ))}
            </Grid>
          )}
        </div>
      </section>

      {/* Find us */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Find us</h2>
          <LogoLinks items={content.marketplaces} />
        </div>
      </section>

      {/* Disclosure corto */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Disclosure text={HOME_COPY.disclosure} />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-6 pb-12">
          <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Subscribe to our newsletter</h3>
            <p className="mt-1 text-sm text-gray-600">Get alerts about guides, curated selections, and launches.</p>
            {subscribed ? (
              <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Thank you for subscribing!</p>
            ) : (
              <form
                className="mt-4 flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
                  setSubscribed(true);
                }}
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                  required
                />
                <button type="submit" className="rounded-md bg-black px-4 py-2 text-white hover:bg-black/90">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
