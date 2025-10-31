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
        bio: "Hello! I'm Karina, a fashion and personal style enthusiast. Through Éclectique by KMC, I share my favorite looks and fashion discoveries that can inspire you to create your own unique style. I love finding versatile pieces that adapt to different occasions and budgets.",
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
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Story
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Meet
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-400 to-accent">
                  Karina
                </span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed">
                The creative mind behind Éclectique by KMC. Fashion enthusiast, 
                style curator, and your guide to discovering timeless elegance.
              </p>
            </div>
            
            {/* Admin Button */}
            {isAdmin && (
              <div className="hidden md:block">
                <a
                  href="/admin/about"
                  className="inline-flex items-center gap-3 rounded-xl bg-accent/10 backdrop-blur-sm border border-accent/20 px-6 py-3 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <svg 
                    className="h-5 w-5" 
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
              </div>
            )}
          </div>
          
          {/* Mobile Admin Button */}
          {isAdmin && (
            <div className="mt-6 md:hidden">
              <a
                href="/admin/about"
                className="inline-flex items-center gap-2 rounded-xl bg-accent/10 backdrop-blur-sm border border-accent/20 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition-all duration-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* About Content Section */}
        <section>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Content */}
            <div className="order-2 lg:order-1">
              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  My Story
                </h2>
                <div className="text-gray-700 leading-relaxed text-lg space-y-6">
                  {bio.split('\n').map((paragraph, index) => (
                    <p key={index} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {/* Call to Action */}
                <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Ready to transform your style?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Join our community and discover looks that reflect your unique personality.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href="/guides" 
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-white font-semibold hover:bg-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Explore Guides
                    </a>
                    <a 
                      href="/contact" 
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Contact Me
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image */}
            <div className="order-1 lg:order-2">
              <div className="relative">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl transform rotate-3"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-gray-100 to-white rounded-3xl transform -rotate-1"></div>
                
                {/* Main image container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                  <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200">
                    <img 
                      src={image} 
                      alt="Karina - Éclectique by KMC" 
                      loading="lazy" 
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  
                  {/* Floating badge */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg">
                      <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
                      Fashion Curator & Style Guide
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              My Values
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The principles that guide every selection and recommendation at Éclectique by KMC
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Authenticity",
                description: "I only recommend products I truly use and love. Your trust is my priority."
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Versatility",
                description: "I look for pieces that adapt to multiple occasions and diverse budgets."
              },
              {
                icon: (
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: "Inspiration",
                description: "My goal is to inspire you to create your own unique style and feel confident."
              }
            ].map((value, index) => (
              <div 
                key={index}
                className="group text-center p-8 rounded-2xl border border-gray-200/60 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300 mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-accent transition-colors">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}