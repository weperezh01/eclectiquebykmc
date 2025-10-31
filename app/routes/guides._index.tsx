import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { ogImage } from "../content/links";
import { getGuides } from "../lib/guide-loader";
import { getGuideThumbnail } from "../utils/thumbnail";

export const meta: MetaFunction = () => ([
  { title: "Guides & Looks | Éclectique by KMC" },
  { name: "description", content: "Style guides and curated looks with purchase links." },
  { property: "og:title", content: "Guides & Looks — Éclectique by KMC" },
  { property: "og:description", content: "Style guides and curated looks with purchase links." },
  { property: "og:image", content: ogImage },
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const guides = await getGuides();
  return json({ guides });
};

export default function Guides() {
  const { guides } = useLoaderData<typeof loader>();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Simple admin check
    const adminAuth = localStorage.getItem('adminAuth') === 'true' || 
                     localStorage.getItem('eclectique_admin_bypass') === 'true';
    setIsAdmin(adminAuth);
  }, []);
  
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {isAdmin && (
        <div className="mb-4 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2 text-sm text-accent flex items-center justify-between">
          <span><span className="font-medium">Admin Mode Active</span> - Press Ctrl+Shift+A to toggle</span>
          <button
            onClick={() => {
              localStorage.setItem('eclectique_admin_mode', 'false');
              setIsAdmin(false);
            }}
            className="text-xs text-accent hover:text-accent/70 underline"
          >
            Disable
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Guides & Looks</h1>
        <div className="flex items-center gap-3">
          {/* Debug info */}
          <span className="text-xs text-gray-500">Admin: {isAdmin ? 'YES' : 'NO'}</span>
          
          {/* Show manage button only if user is authenticated as admin */}
          {isAdmin && (
            <a
              href="/admin/guides"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors shadow-sm"
            >
              <svg 
                className="h-4 w-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              Manage Guides
            </a>
          )}
        </div>
      </div>
      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => {
          const thumbnail = getGuideThumbnail(g);
          const itemCount = g.items?.length || 0;
          
          return (
            <a 
              key={g.slug} 
              href={`/guides/${g.slug}`} 
              className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden"
            >
              {/* Thumbnail Image */}
              <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                <img
                  src={thumbnail}
                  alt={g.title}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 group-hover:text-accent transition-colors">
                    {g.title}
                  </h3>
                  {g.youtubeUrl && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                        <svg 
                          className="h-3 w-3" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {g.intro}
                </p>
                
                {/* Stats */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                      </svg>
                      {itemCount} items
                    </span>
                    {g.youtubeUrl && (
                      <span className="flex items-center gap-1 text-red-500">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Video
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-accent font-medium group-hover:text-accent/80">
                    Ver guía →
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </section>
    </main>
  );
}