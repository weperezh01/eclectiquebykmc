import type { MetaFunction } from "@remix-run/node";
import { content, ogImage } from "../content/links";

export const meta: MetaFunction = () => ([
  { title: "Otras plataformas | Éclectique by KMC" },
  { name: "description", content: "Encuéntranos también en Instagram." },
  { property: "og:title", content: "Otras plataformas — Éclectique by KMC" },
  { property: "og:description", content: "Instagram" },
  { property: "og:image", content: ogImage },
]);

export default function OtrasPlataformas() {
  const instagram = content.social.instagram;
  const pinterest = content.social.pinterest;
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Otras plataformas</h1>
      <p className="mt-2 max-w-3xl text-gray-600">Contenido adicional y contacto en redes sociales.</p>
      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[
          { name: 'Instagram', href: instagram, logo: '/images/logos/instagram.svg', blurb: 'Outfits y novedades.' },
          { name: 'Pinterest', href: pinterest, logo: '/images/logos/pinterest.svg', blurb: 'Moodboards e ideas.' },
        ].map((m) => (
          <a
            key={m.name}
            href={m.href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-5 transition hover:border-accent hover:shadow-sm"
          >
            <img src={m.logo} alt={`${m.name} logo`} className="h-10 w-10 object-contain" />
            <div className="text-center">
              <h3 className="font-semibold leading-tight">{m.name}</h3>
              <p className="mt-1 text-xs text-gray-600">{m.blurb}</p>
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}
