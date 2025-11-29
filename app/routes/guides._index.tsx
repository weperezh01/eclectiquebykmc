import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { ogImage } from "../content/links";
import { getGuides } from "../lib/guide-loader";
import { getGuideThumbnail } from "../utils/thumbnail";
import { FaPercent, FaTags, FaFire, FaGift } from "react-icons/fa6";

// Deal categories for shop-deals style view
const dealCategories = [
  {
    name: "Flash Sales",
    icon: FaFire,
    blurb: "Limited time offers",
    bgColor: "bg-red-50",
    hoverBg: "hover:bg-red-100",
    borderColor: "border-red-200",
    hoverBorder: "hover:border-red-300",
    iconColor: "text-red-600"
  },
  {
    name: "Daily Deals",
    icon: FaPercent,
    blurb: "Special discounts today",
    bgColor: "bg-green-50",
    hoverBg: "hover:bg-green-100",
    borderColor: "border-green-200",
    hoverBorder: "hover:border-green-300",
    iconColor: "text-green-600"
  },
  {
    name: "Bundle Offers",
    icon: FaTags,
    blurb: "More for less",
    bgColor: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    borderColor: "border-blue-200",
    hoverBorder: "hover:border-blue-300",
    iconColor: "text-blue-600"
  },
  {
    name: "Gift Sets",
    icon: FaGift,
    blurb: "Perfect for gifting",
    bgColor: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
    borderColor: "border-purple-200",
    hoverBorder: "hover:border-purple-300",
    iconColor: "text-purple-600"
  },
];

export const meta: MetaFunction = () => ([
  { title: "Guides & Looks | Éclectique by KMC" },
  { name: "description", content: "Style guides and curated looks with purchase links." },
  { property: "og:title", content: "Guides & Looks — Éclectique by KMC" },
  { property: "og:description", content: "Style guides and curated looks with purchase links." },
  { property: "og:image", content: ogImage },
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const guides = await getGuides();
  
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
  
  return json({ guides, isAdmin });
};

export default function Guides() {
  const { guides, isAdmin } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get('view');
  const isDealsView = viewMode === 'deals';
  
  // Filter guides by type based on view mode
  const filteredGuides = isDealsView 
    ? guides.filter(guide => guide.guideType === 'Deal')
    : guides.filter(guide => guide.guideType === 'Look' || !guide.guideType);
  
  if (isDealsView) {
    // Render Shop Deals style layout
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-amber-50/20 to-white">
        {/* Shop Deals Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
          <div className="relative mx-auto max-w-6xl px-6 py-20">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-6 py-2 text-sm font-semibold text-amber-200 mb-8">
                  <FaPercent className="h-4 w-4" />
                  Exclusive Deals
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                  Shop 
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300">
                    Exclusive Deals
                  </span>
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-amber-100 leading-relaxed mb-8">
                  Discover amazing deals and special offers on curated fashion and lifestyle products. 
                  Limited time promotions you won't want to miss.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 backdrop-blur-sm px-6 py-3 text-sm font-medium text-amber-200">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  💡 Pro tip: Check guides for bundle savings
                </div>
              </div>
              
              {/* Admin Button for Deals View */}
              {isAdmin && (
                <div className="hidden md:block">
                  <a
                    href="/admin/guides?type=Deal"
                    className="inline-flex items-center gap-3 rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 px-6 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-500/30 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                    Manage Deals
                  </a>
                </div>
              )}
            </div>
            
            {/* Mobile Admin Button for Deals View */}
            {isAdmin && (
              <div className="mt-6 md:hidden text-center">
                <a
                  href="/admin/guides?type=Deal"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/30 hover:text-white transition-all duration-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Manage
                </a>
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-16">
          {/* Deal Categories Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Deal Categories
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Browse our curated deals by category
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dealCategories.map((category) => (
                <div
                  key={category.name}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className={`flex-shrink-0 p-3 rounded-xl ${category.bgColor} ${category.hoverBg} border ${category.borderColor} ${category.hoverBorder} transition-all duration-300`}>
                        <category.icon 
                          size={48} 
                          className={`${category.iconColor} transition-transform duration-300 group-hover:scale-110`}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-300">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 font-medium">
                          {category.blurb}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 rounded-full p-2 bg-gray-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                      <FaTags className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Deal Guides Section */}
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Exclusive Deal Guides
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Curated collections of discounted items and special offers
              </p>
            </div>
            
            {filteredGuides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredGuides.map((guide) => {
                  const thumbnail = getGuideThumbnail(guide);
                  
                  return (
                    <div key={guide.slug} className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Deal Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-lg">
                          <FaPercent className="h-3 w-3" />
                          DEAL
                        </span>
                      </div>

                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={guide.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = '/images/guide-placeholder.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                      </div>

                      {/* Content */}
                      <div className="relative p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors duration-300">
                          {guide.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {guide.intro}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{guide.items.length} items</span>
                            {guide.videos && guide.videos.length > 0 && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                {guide.videos.length}
                              </span>
                            )}
                          </div>
                          
                          <a
                            href={`/guides/${guide.slug}`}
                            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            View Deal
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="rounded-full bg-gray-100 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <FaPercent className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Deals Available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  We're working on bringing you exclusive deals. Check back soon for amazing offers on curated fashion and lifestyle products.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  // Original guides layout for non-deals view
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Style Guides
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Curated
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-400 to-accent">
                  Style Guides
                </span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed">
                Discover our signature looks and styling guides. Each collection is carefully curated 
                to inspire your next outfit and help you express your unique style.
              </p>
            </div>
            
            {/* Admin Button */}
            {isAdmin && (
              <div className="hidden md:block">
                <a
                  href="/admin/guides?type=Look"
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
              </div>
            )}
          </div>
          
          {/* Mobile Admin Button */}
          {isAdmin && (
            <div className="mt-6 md:hidden">
              <a
                href="/admin/guides?type=Look"
                className="inline-flex items-center gap-2 rounded-xl bg-accent/10 backdrop-blur-sm border border-accent/20 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition-all duration-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Guides Grid Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Signature Collections
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our carefully crafted style guides designed to elevate your wardrobe
            </p>
          </div>
          
          {filteredGuides.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Guides Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                We're currently curating our latest style guides. Check back soon for amazing outfit inspiration!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGuides.map((g, index) => {
                const thumbnail = getGuideThumbnail(g);
                const itemCount = g.items?.length || 0;
                
                return (
                  <a 
                    key={g.slug} 
                    href={`/guides/${g.slug}`} 
                    className="group relative rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Thumbnail Image */}
                    <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
                      <img
                        src={thumbnail}
                        alt={g.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* YouTube Badge - Show for both new videos system and legacy single video */}
                      {((g.videos && g.videos.length > 0) || g.youtubeUrl) && (
                        <div className="absolute top-4 right-4 z-10">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                            <svg 
                              className="h-4 w-4" 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            {/* Multiple videos badge */}
                            {g.videos && g.videos.length > 1 && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">
                                {g.videos.length}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Quick View Badge */}
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-lg">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                          </svg>
                          {itemCount} pieces
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-xl text-gray-900 line-clamp-1 group-hover:text-accent transition-colors">
                          {g.title}
                        </h3>
                        <div className="flex-shrink-0 rounded-full p-2 bg-gray-100 group-hover:bg-accent group-hover:text-white transition-all duration-300 ml-3">
                          <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 line-clamp-2 leading-relaxed mb-4 group-hover:text-gray-700 transition-colors">
                        {g.intro}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                            </svg>
                            {itemCount} items
                          </span>
                          
                          {((g.videos && g.videos.length > 0) || g.youtubeUrl) && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 group-hover:bg-red-100 transition-colors">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              {g.videos && g.videos.length > 1 
                                ? `${g.videos.length} Videos` 
                                : 'Video Guide'
                              }
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-accent font-semibold group-hover:text-accent/80 transition-colors">
                          Explore →
                        </div>
                      </div>
                    </div>
                    
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
