import type { MetaFunction } from "@remix-run/node";
import { content, ogImage } from "../content/links";

export const meta: MetaFunction = () => ([
  { title: "Marketplaces | Éclectique by KMC" },
  { name: "description", content: "Encuentra nuestras recomendaciones y looks en Amazon, LTK, TikTok, Pinterest y Shein." },
  { property: "og:title", content: "Marketplaces — Éclectique by KMC" },
  { property: "og:description", content: "Amazon Storefront, LTK, TikTok, Pinterest y Shein" },
  { property: "og:image", content: ogImage },
]);

export default function Marketplaces() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Marketplaces</h1>
      <p className="mt-2 max-w-3xl text-gray-600">
        Encuéntranos y compra desde nuestras vitrinas en distintas plataformas.
      </p>
      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {content.marketplaces.map((m) => (
          <a
            key={m.name}
            href={m.href}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-5 transition hover:border-accent hover:shadow-sm"
          >
            <img src={m.logo} alt={`${m.name} logo`} loading="lazy" className="h-10 w-10 object-contain" />
            <div className="text-center">
              <h3 className="font-semibold leading-tight">{m.name}</h3>
              {m.blurb ? <p className="mt-1 text-xs text-gray-600">{m.blurb}</p> : null}
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
