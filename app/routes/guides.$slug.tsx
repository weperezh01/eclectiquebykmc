import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Card from "../components/Card";
import YouTubeEmbed from "../components/YouTubeEmbed";
import VideoEmbed from "../components/VideoEmbed";
import { ogImage } from "../content/links";
import { getGuide } from "../lib/guide-loader";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (!params.slug) {
    throw new Response("Not Found", { status: 404 });
  }
  
  const guide = await getGuide(params.slug);
  if (!guide) throw new Response("Not Found", { status: 404 });
  return json({ guide });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => (
  data
    ? [
        { title: `${data.guide.title} | Guides — Éclectique by KMC` },
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
      
      {/* Cover Image - highest priority */}
      {guide.coverImage && guide.coverImage.trim() && (
        <div className="mt-6">
          <img 
            src={guide.coverImage} 
            alt={guide.title}
            className="w-full max-w-4xl h-64 sm:h-80 lg:h-96 object-cover rounded-lg"
          />
        </div>
      )}
      
      {/* Show videos - prioritize new video system, fallback to old single video */}
      {guide.videos && guide.videos.length > 0 ? (
        <section className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Style Videos</h2>
            <p className="text-gray-600 mt-1">Watch how to style and wear these pieces</p>
          </div>
          <div className="space-y-6">
            {guide.videos.map((video: any, index: number) => (
            <div key={index} className="max-w-4xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </div>
                {video.title && (
                  <h3 className="text-lg font-medium">{video.title}</h3>
                )}
                {!video.title && (
                  <h3 className="text-lg font-medium text-gray-700">Video {index + 1}</h3>
                )}
              </div>
              <VideoEmbed 
                platform={video.platform || 'youtube'} 
                url={video.video_url || video.youtube_url} 
                className="w-full" 
              />
            </div>
            ))}
          </div>
        </section>
      ) : guide.youtubeUrl ? (
        <section className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Style Video</h2>
            <p className="text-gray-600 mt-1">Watch how to style and wear these pieces</p>
          </div>
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                1
              </div>
              <h3 className="text-lg font-medium text-gray-700">Style Tutorial</h3>
            </div>
            <YouTubeEmbed url={guide.youtubeUrl} className="w-full" />
          </div>
        </section>
      ) : null}
      
      {guide.items && guide.items.length > 0 && (
        <section className="mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Shop the Look</h2>
            <p className="text-gray-600 mt-1">Get the pieces to recreate this style</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guide.items.map((it: any, index: number) => (
              <div key={it.title} className="relative">
                <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shadow-lg">
                  {index + 1}
                </div>
                <Card title={it.title} image={it.image} href={it.href} label="Shop Now" />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}