import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ogImage } from "../content/links";
import { pool } from "../lib/db";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT bio, image_url FROM about_content ORDER BY updated_at DESC LIMIT 1');
    
    let aboutData;
    if (result.rows.length === 0) {
      // Fallback to default content if nothing in database
      aboutData = {
        bio: "¡Hola! Soy Karina, una apasionada de la moda y el estilo personal. A través de Éclectique by KMC, comparto mis looks favoritos y descubrimientos de moda que pueden inspirarte a crear tu propio estilo único. Me encanta encontrar piezas versátiles que se adapten a diferentes ocasiones y presupuestos.",
        image: "/images/kmc.webp"
      };
    } else {
      aboutData = {
        bio: result.rows[0].bio,
        image: result.rows[0].image_url
      };
    }
    
    // Check if user is authenticated and is admin
    let isAdmin = false;
    try {
      const authHeader = request.headers.get('Authorization');
      const cookieHeader = request.headers.get('Cookie');

      const backendUrl = process.env.NODE_ENV === 'production'
        ? 'http://eclectique-backend:8020'
        : 'http://localhost:8020';

      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;
      if (cookieHeader) headers['Cookie'] = cookieHeader;

      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const userData = await response.json();
        isAdmin = userData?.is_admin === true;
      }
    } catch (error) {
      // If auth fails, isAdmin remains false
      console.log('Auth check failed:', error);
    }
    
    return json({ ...aboutData, isAdmin });
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
  const { bio, image, isAdmin } = useLoaderData<typeof loader>();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      
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