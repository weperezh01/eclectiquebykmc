import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { ogImage } from "../content/links";
import { pool } from "../lib/db";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT bio, image_url FROM about_content ORDER BY updated_at DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      // Fallback to default content if nothing in database
      return json({
        bio: "¡Hola! Soy Karina, una apasionada de la moda y el estilo personal. A través de Éclectique by KMC, comparto mis looks favoritos y descubrimientos de moda que pueden inspirarte a crear tu propio estilo único. Me encanta encontrar piezas versátiles que se adapten a diferentes ocasiones y presupuestos.",
        image: "/images/kmc.webp"
      });
    }
    
    return json({
      bio: result.rows[0].bio,
      image: result.rows[0].image_url
    });
  } finally {
    client.release();
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => ([
  { title: "About KMC | Éclectique by KMC" },
  { name: "description", content: data?.bio || "About KMC" },
  { property: "og:title", content: "About KMC — Éclectique by KMC" },
  { property: "og:description", content: data?.bio || "About KMC" },
  { property: "og:image", content: ogImage },
]);

export default function About() {
  const { bio, image } = useLoaderData<typeof loader>();
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
        <h1 className="text-3xl font-bold">About KMC</h1>
        {/* Show manage button only if user is authenticated as admin */}
        {isAdmin && (
          <a
            href="/admin/about"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
              />
            </svg>
            Edit About
          </a>
        )}
      </div>
      
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-gray-700 leading-relaxed">{bio}</p>
        </div>
        <div>
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4 flex items-center justify-center min-h-[300px]">
            <img 
              src={image} 
              alt="KMC" 
              loading="lazy" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm" 
            />
          </div>
        </div>
      </div>
    </main>
  );
}