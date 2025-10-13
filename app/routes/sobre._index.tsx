import type { MetaFunction } from "@remix-run/node";
import { HOME_COPY, ogImage } from "../content/links";

export const meta: MetaFunction = () => ([
  { title: "Sobre KMC | Éclectique by KMC" },
  { name: "description", content: HOME_COPY.bio },
  { property: "og:title", content: "Sobre KMC — Éclectique by KMC" },
  { property: "og:description", content: HOME_COPY.bio },
  { property: "og:image", content: ogImage },
]);

export default function Sobre() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Sobre KMC</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-gray-700 leading-relaxed">{HOME_COPY.bio}</p>
        </div>
        <div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 aspect-[4/3]">
            <img src="/images/kmc.webp" alt="KMC" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </main>
  );
}

