import type { MetaFunction } from "@remix-run/node";
import { content, ogImage } from "../content/links";

export const meta: MetaFunction = () => ([
  { title: "Guías & Looks | Éclectique by KMC" },
  { name: "description", content: "Looks y guías rápidas con enlaces de compra." },
  { property: "og:title", content: "Guías & Looks — Éclectique by KMC" },
  { property: "og:image", content: ogImage },
]);

export default function Guias() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Guías & Looks</h1>
      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {content.guides.map((g) => (
          <a key={g.slug} href={`/guias/${g.slug}`} className="rounded-lg border border-gray-200 bg-white p-5 hover:shadow-sm">
            <h3 className="font-semibold">{g.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{g.intro}</p>
          </a>
        ))}
      </section>
    </main>
  );
}

