import type { MetaFunction } from "@remix-run/node";
import { content, ogImage } from "../content/links";
import { FaInstagram, FaTiktok, FaPinterest, FaFacebook } from "react-icons/fa6";

export const meta: MetaFunction = () => ([
  { title: "Social Platforms | Éclectique by KMC" },
  { name: "description", content: "Connect with us across all social platforms - Instagram, Pinterest, Facebook, and TikTok for daily fashion inspiration and exclusive content." },
  { property: "og:title", content: "Social Platforms — Éclectique by KMC" },
  { property: "og:description", content: "Follow our fashion journey on Instagram, Pinterest, Facebook, and TikTok for daily inspiration and exclusive content." },
  { property: "og:image", content: ogImage },
]);

export default function OtherPlatforms() {
  const instagram = content.social.instagram;
  const pinterest = content.social.pinterest;
  const facebook = content.social.facebook;
  const tiktok = content.social.tiktok;
  
  const socialPlatforms = [
    { 
      name: 'Instagram', 
      href: instagram, 
      icon: FaInstagram,
      blurb: 'Daily outfits, styling tips, and behind-the-scenes content',
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-gradient-to-br from-pink-50 to-purple-50'
    },
    { 
      name: 'Pinterest', 
      href: pinterest, 
      icon: FaPinterest,
      blurb: 'Curated moodboards, fashion inspiration, and style guides',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-50'
    },
    { 
      name: 'Facebook', 
      href: facebook, 
      icon: FaFacebook,
      blurb: 'Community updates, fashion discussions, and exclusive content',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50'
    },
    { 
      name: 'TikTok', 
      href: tiktok, 
      icon: FaTiktok,
      blurb: 'Quick styling videos, fashion hauls, and trend alerts',
      color: 'from-gray-800 to-gray-900',
      bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100'
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h2a1 1 0 011 1v0" />
            </svg>
            Social Presence
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Connect With Us
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-400 to-accent">
              Everywhere
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed">
            Follow our journey across all platforms for daily inspiration, exclusive content, 
            and the latest fashion discoveries from our curated collection.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Social Platforms Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Follow Our Story
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each platform offers unique content and perspectives on our fashion journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 ${platform.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-white/80 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                      <platform.icon 
                        size={48}
                        className="transition-transform duration-300 group-hover:scale-110 text-gray-700" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                        {platform.name}
                      </h3>
                      <div className="flex-shrink-0 rounded-full p-2 bg-gray-100 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-accent transition-all duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed mb-4 group-hover:text-gray-700 transition-colors duration-300">
                      {platform.blurb}
                    </p>
                    
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:text-accent/80 transition-colors duration-300">
                      <span>Follow Us</span>
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full"></div>
              </a>
            ))}
          </div>
          
          {/* Call to Action Section */}
          <div className="mt-16 text-center">
            <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-white via-accent/5 to-white p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Never Miss an Update
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                Join our community across all platforms to get the complete Éclectique experience. 
                From daily outfit inspiration to exclusive behind-the-scenes content.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {socialPlatforms.map((platform) => (
                  <a
                    key={`cta-${platform.name}`}
                    href={platform.href}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-accent transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <platform.icon size={16} className="text-gray-600" />
                    {platform.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}