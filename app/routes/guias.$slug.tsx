import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Card from "../components/Card";
import { content, ogImage } from "../content/links";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const guide = content.guides.find((g) => g.slug === params.slug);
  if (!guide) throw new Response("Not Found", { status: 404 });
  return json({ guide });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => (
  data
    ? [
        { title: `${data.guide.title} | Guías — Éclectique by KMC` },
        { name: "description", content: data.guide.intro },
        { property: "og:title", content: data.guide.title },
        { property: "og:description", content: data.guide.intro },
        { property: "og:image", content: ogImage },
      ]
    : []
);

export default function GuideDetail() {
  const { guide } = useLoaderData<typeof loader>();
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">{guide.title}</h1>
      <p className="mt-2 max-w-3xl text-gray-600">{guide.intro}</p>
      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guide.items.map((it: any) => (
          <Card key={it.title} title={it.title} image={it.image} href={it.href} label="Ver" />
        ))}
      </section>
    </main>
  );
}

