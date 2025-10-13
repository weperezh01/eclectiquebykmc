import type { MetaFunction } from "@remix-run/node";
import ContactForm from "../components/ContactForm";
import { ogImage } from "../content/links";

export const meta: MetaFunction = () => ([
  { title: "Contacto | Éclectique by KMC" },
  { name: "description", content: "¿Tienes dudas o colaboraciones? Escríbenos aquí o por redes." },
  { property: "og:title", content: "Contacto — Éclectique by KMC" },
  { property: "og:image", content: ogImage },
]);

export default function Contacto() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Contacto</h1>
      <p className="mt-2 text-gray-600">Déjanos un mensaje o escríbenos por Instagram/TikTok.</p>
      <div className="mt-6">
        <ContactForm />
      </div>
    </main>
  );
}

