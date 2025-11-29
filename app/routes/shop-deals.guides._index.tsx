import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { ogImage } from "../content/links";
import { getDeals } from "../lib/deal-loader";

export const meta: MetaFunction = () => ([
  { title: "Deal Guides & Offers | Éclectique by KMC" },
  { name: "description", content: "Exclusive deal guides and promotional offers with special pricing." },
  { property: "og:title", content: "Deal Guides & Offers — Éclectique by KMC" },
  { property: "og:description", content: "Exclusive deal guides and promotional offers with special pricing." },
  { property: "og:image", content: ogImage },
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const deals = await getDeals();
  
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
  
  return json({ deals, isAdmin });
};

export default function ShopDealsGuides() {
  const { deals: initialDeals, isAdmin } = useLoaderData<typeof loader>();
  const [deals, setDeals] = useState(initialDeals);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for creating new deals
  const [newDeal, setNewDeal] = useState({
    slug: '',
    title: '',
    intro: '',
    coverImage: '',
    discountPercentage: 0,
    isPublic: true,
    videos: [] as any[],
    items: [] as any[]
  });

  // Load deals from API
  const loadDeals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/deals');
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create or update deal
  const saveDeal = async () => {
    try {
      setLoading(true);
      const dealData = {
        ...newDeal,
        items: newDeal.items.map(item => ({
          title: item.title,
          image_url: item.image_url || item.image,
          href: item.href,
          original_price: item.original_price,
          sale_price: item.sale_price,
          discount_percentage: item.discount_percentage,
          is_featured: item.is_featured || false
        }))
      };

      const url = editingDeal ? `/api/deals/${editingDeal.slug}` : '/api/deals';
      const method = editingDeal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData)
      });

      if (response.ok) {
        setShowForm(false);
        setEditingDeal(null);
        setNewDeal({
          slug: '',
          title: '',
          intro: '',
          coverImage: '',
          discountPercentage: 0,
          isPublic: true,
          videos: [],
          items: []
        });
        await loadDeals();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error saving deal');
      }
    } catch (error) {
      setError('Error saving deal');
    } finally {
      setLoading(false);
    }
  };

  // Delete deal
  const deleteDeal = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      const response = await fetch(`/api/deals/${slug}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadDeals();
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  // Get deal thumbnail
  const getDealThumbnail = (deal: any) => {
    if (deal.coverImage) return deal.coverImage;
    if (deal.items && deal.items.length > 0) {
      const firstItem = deal.items[0];
      return firstItem.image_url || firstItem.image || '/images/default-deal.jpg';
    }
    return '/images/default-deal.jpg';
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50/30 via-amber-50/20 to-yellow-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-900 via-amber-900 to-yellow-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/20 px-4 py-2 text-sm font-medium text-yellow-300 mb-6">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Deal Guides
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Exclusive
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300">
                  Deal Guides
                </span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl text-orange-100 leading-relaxed">
                Discover our exclusive deal collections and promotional offers. Each guide features 
                specially curated items at amazing prices to maximize your savings.
              </p>
            </div>
            
            {/* Admin Button */}
            {isAdmin && (
              <div className="hidden md:block">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-3 rounded-xl bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 px-6 py-3 text-sm font-semibold text-yellow-300 hover:bg-yellow-400 hover:text-orange-900 transition-all duration-300 shadow-lg hover:shadow-xl"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                    />
                  </svg>
                  New Deal
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile Admin Button */}
          {isAdmin && (
            <div className="mt-6 md:hidden">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 px-4 py-2 text-sm font-semibold text-yellow-300 hover:bg-yellow-400 hover:text-orange-900 transition-all duration-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Deal
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Deal Features Banner */}
        <section className="mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-orange-100 via-amber-50 to-yellow-100 border border-orange-200 p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 text-white shadow-lg">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent mb-4">
              Special Deal Features
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
              Every deal guide includes exclusive discounts, limited-time offers, and bundle savings 
              to help you get the most value from your purchases.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white mb-3">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Flash Sales</h3>
                <p className="text-sm text-gray-600">Limited-time offers with deep discounts</p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-white mb-3">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Bundle Deals</h3>
                <p className="text-sm text-gray-600">Save more when you buy complete sets</p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white mb-3">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Seasonal Sales</h3>
                <p className="text-sm text-gray-600">Holiday and seasonal special pricing</p>
              </div>
            </div>
          </div>
        </section>

        {/* Guides Grid Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Deal Collections
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our handpicked deal guides designed to maximize your savings and style
            </p>
          </div>
          
          {deals.length === 0 ? (
            <div className="text-center py-20 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mb-6">
                <svg className="h-10 w-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Deals Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {isAdmin ? "Click 'New Deal' to create your first deal collection!" : "We're currently preparing amazing deal collections for you. Check back soon for incredible savings!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deals.map((deal, index) => {
                const thumbnail = getDealThumbnail(deal);
                const itemCount = deal.items?.length || 0;
                
                return (
                  <div 
                    key={deal.slug} 
                    className="group relative rounded-2xl border border-orange-200/60 bg-white shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Deal Badge - Orange/Gold style */}
                    <div className="absolute top-4 left-4 z-20 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-bold flex items-center justify-center shadow-xl border-2 border-white/90">
                      <div className="text-center">
                        <div className="text-xs leading-none">DEAL</div>
                        <div className="text-lg leading-none">{index + 1}</div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingDeal(deal);
                            setNewDeal({
                              slug: deal.slug,
                              title: deal.title,
                              intro: deal.intro,
                              coverImage: deal.coverImage || '',
                              discountPercentage: deal.discountPercentage || 0,
                              isPublic: deal.isPublic,
                              videos: deal.videos || [],
                              items: deal.items || []
                            });
                            setShowForm(true);
                          }}
                          className="rounded-full bg-blue-500 text-white p-2 shadow-lg hover:bg-blue-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteDeal(deal.slug)}
                          className="rounded-full bg-red-500 text-white p-2 shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {!isAdmin && (
                      <div className="absolute top-4 right-4 z-20">
                        <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 shadow-lg">
                          {deal.discountPercentage ? `${deal.discountPercentage}% OFF` : 'SPECIAL DEAL'}
                        </div>
                      </div>
                    )}

                    {/* Thumbnail Image */}
                    <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-orange-100 to-amber-200 relative">
                      <img
                        src={thumbnail}
                        alt={deal.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      
                      {/* Deal Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-600/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* YouTube Badge */}
                      {deal.videos && deal.videos.length > 0 && (
                        <div className="absolute bottom-4 right-4 z-10">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 relative">
                            <svg 
                              className="h-4 w-4" 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                            {deal.videos.length > 1 && (
                              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                                {deal.videos.length}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Quick Deal Info */}
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-lg">
                          <svg className="h-3 w-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                          </svg>
                          {itemCount} items
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-xl text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                          {deal.title}
                        </h3>
                        <div className="flex-shrink-0 rounded-full p-2 bg-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 ml-3">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 line-clamp-2 leading-relaxed mb-4 group-hover:text-gray-700 transition-colors">
                        {deal.intro}
                      </p>
                      
                      {/* Deal Tags */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                            {itemCount} items
                          </span>
                          
                          {deal.videos && deal.videos.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 group-hover:bg-red-100 transition-colors">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              {deal.videos.length > 1 
                                ? `${deal.videos.length} Videos` 
                                : 'Video'
                              }
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-orange-600 font-semibold group-hover:text-orange-700 transition-colors">
                          {deal.discountPercentage ? `Save ${deal.discountPercentage}%` : 'Special Deal'} →
                        </div>
                      </div>
                    </div>
                    
                    {/* Deal shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* New Deal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDeal ? 'Edit Deal' : 'Create New Deal'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingDeal(null);
                    setNewDeal({
                      slug: '',
                      title: '',
                      intro: '',
                      coverImage: '',
                      discountPercentage: 0,
                      isPublic: true,
                      videos: [],
                      items: []
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deal Title
                    </label>
                    <input
                      type="text"
                      value={newDeal.title}
                      onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Summer Sale Collection"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL)
                    </label>
                    <input
                      type="text"
                      value={newDeal.slug}
                      onChange={(e) => setNewDeal({...newDeal, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="summer-sale-collection"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newDeal.intro}
                      onChange={(e) => setNewDeal({...newDeal, intro: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Describe this deal collection..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      value={newDeal.coverImage}
                      onChange={(e) => setNewDeal({...newDeal, coverImage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Percentage
                    </label>
                    <input
                      type="number"
                      value={newDeal.discountPercentage}
                      onChange={(e) => setNewDeal({...newDeal, discountPercentage: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="50"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newDeal.isPublic}
                      onChange={(e) => setNewDeal({...newDeal, isPublic: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                      Make this deal public
                    </label>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Deal Items
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewDeal({
                        ...newDeal,
                        items: [...newDeal.items, {
                          title: '',
                          image_url: '',
                          href: '',
                          original_price: 0,
                          sale_price: 0,
                          discount_percentage: 0,
                          is_featured: false
                        }]
                      })}
                      className="text-orange-600 hover:text-orange-800 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>

                  {newDeal.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Item {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setNewDeal({
                            ...newDeal,
                            items: newDeal.items.filter((_, i) => i !== index)
                          })}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updatedItems = [...newDeal.items];
                          updatedItems[index].title = e.target.value;
                          setNewDeal({...newDeal, items: updatedItems});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Item title"
                      />
                      
                      <input
                        type="url"
                        value={item.image_url}
                        onChange={(e) => {
                          const updatedItems = [...newDeal.items];
                          updatedItems[index].image_url = e.target.value;
                          setNewDeal({...newDeal, items: updatedItems});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Image URL"
                      />
                      
                      <input
                        type="url"
                        value={item.href}
                        onChange={(e) => {
                          const updatedItems = [...newDeal.items];
                          updatedItems[index].href = e.target.value;
                          setNewDeal({...newDeal, items: updatedItems});
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Product URL"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={item.original_price || ''}
                          onChange={(e) => {
                            const updatedItems = [...newDeal.items];
                            updatedItems[index].original_price = parseFloat(e.target.value) || 0;
                            setNewDeal({...newDeal, items: updatedItems});
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Original Price"
                          min="0"
                          step="0.01"
                        />
                        
                        <input
                          type="number"
                          value={item.sale_price || ''}
                          onChange={(e) => {
                            const updatedItems = [...newDeal.items];
                            updatedItems[index].sale_price = parseFloat(e.target.value) || 0;
                            setNewDeal({...newDeal, items: updatedItems});
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Sale Price"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.is_featured}
                          onChange={(e) => {
                            const updatedItems = [...newDeal.items];
                            updatedItems[index].is_featured = e.target.checked;
                            setNewDeal({...newDeal, items: updatedItems});
                          }}
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Featured Item
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDeal(null);
                    setError(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDeal}
                  disabled={loading || !newDeal.title || !newDeal.slug || !newDeal.intro}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}