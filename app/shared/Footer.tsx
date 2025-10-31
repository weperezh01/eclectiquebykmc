import { LINKS } from "../data/links";
import { FaInstagram, FaTiktok, FaPinterest, FaFacebook, FaBagShopping, FaStore, FaLink, FaHeart, FaEnvelope, FaCode } from "react-icons/fa6";
import { SiEbay, SiWalmart } from "react-icons/si";
import MarketplaceIcon from "../components/MarketplaceIcon";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Éclectique by KMC</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Curated fashion and lifestyle products to help you express your unique style. 
              Discover timeless pieces that adapt to every occasion and budget.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaHeart className="text-accent" />
              <span>Curated with love for style enthusiasts</span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/shops" className="text-gray-600 hover:text-accent transition-colors">Shops</a></li>
              <li><a href="/affiliates" className="text-gray-600 hover:text-accent transition-colors">Affiliates</a></li>
              <li><a href="/other-platforms" className="text-gray-600 hover:text-accent transition-colors">Social Platforms</a></li>
              <li><a href="/guides" className="text-gray-600 hover:text-accent transition-colors">Style Guides</a></li>
            </ul>
          </div>
          
          {/* Connect */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/about" className="text-gray-600 hover:text-accent transition-colors">About Karina</a></li>
              <li><a href="/contact" className="text-gray-600 hover:text-accent transition-colors">Get in Touch</a></li>
              <li><a href="/privacy" className="text-gray-600 hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-600 hover:text-accent transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        {/* Social Media Section */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <h4 className="font-semibold text-gray-900 mb-4 text-center">Follow Our Journey</h4>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {/* Social Media */}
            <a
              href={LINKS.instagram}
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
              title="Follow us on Instagram"
            >
              <FaInstagram size={20} className="group-hover:scale-110 transition-transform" />
            </a>
            <a
              href="https://www.facebook.com/kari.cruz.543"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
              title="Follow us on Facebook"
            >
              <FaFacebook size={20} className="group-hover:scale-110 transition-transform" />
            </a>
            
            {/* TikTok */}
            {LINKS.tiktok_showcase && (
              <a
                href={LINKS.tiktok_showcase}
                aria-label="TikTok"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
                title="Follow us on TikTok"
              >
                <FaTiktok size={20} className="group-hover:scale-110 transition-transform" />
              </a>
            )}
            
            {/* Pinterest */}
            {LINKS.pinterest && (
              <a
                href={LINKS.pinterest}
                aria-label="Pinterest"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
                title="Follow us on Pinterest"
              >
                <FaPinterest size={20} className="group-hover:scale-110 transition-transform" />
              </a>
            )}
          </div>
        </div>
        
        {/* Marketplaces Section */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <h4 className="font-semibold text-gray-900 mb-4 text-center">Shop Our Selections</h4>
          <div className="flex flex-wrap justify-center items-center gap-3">
            <a
              href={LINKS.ebay}
              aria-label="eBay"
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="group p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300"
              title="Shop on eBay"
            >
              <SiEbay size={18} className="text-blue-700 group-hover:scale-110 transition-transform" />
            </a>
            <a
              href={LINKS.mercari}
              aria-label="Mercari"
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="group p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-300"
              title="Shop on Mercari"
            >
              <FaBagShopping size={18} className="text-red-600 group-hover:scale-110 transition-transform" />
            </a>
            <a
              href={LINKS.poshmark}
              aria-label="Poshmark"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all duration-300"
              title="Shop on Poshmark"
            >
              <FaStore size={18} className="text-rose-600 group-hover:scale-110 transition-transform" />
            </a>
            
            {/* Amazon Storefront */}
            {LINKS.amazon_storefront && (
              <a
                href={LINKS.amazon_storefront}
                aria-label="Amazon Storefront"
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group p-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all duration-300"
                title="Amazon Storefront"
              >
                <MarketplaceIcon marketplace="Amazon" size={18} className="group-hover:scale-110 transition-transform" />
              </a>
            )}
            
            {/* LTK */}
            {LINKS.ltk && (
              <a
                href={LINKS.ltk}
                aria-label="LTK"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-300"
                title="LTK"
              >
                <MarketplaceIcon marketplace="LTK" size={18} className="group-hover:scale-110 transition-transform" />
              </a>
            )}
            
            {/* Walmart */}
            {LINKS.walmart && (
              <a
                href={LINKS.walmart}
                aria-label="Walmart"
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300"
                title="Walmart"
              >
                <MarketplaceIcon marketplace="Walmart" size={18} className="group-hover:scale-110 transition-transform" />
              </a>
            )}
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-600">© {new Date().getFullYear()} Éclectique by KMC</p>
              <p className="text-xs text-gray-500 mt-1">
                Some links are affiliate links. As Amazon Associates we earn from qualifying purchases, at no extra cost to you.
              </p>
            </div>
            
            {/* Developer Credit */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaCode className="text-accent" />
              <span>Developed with</span>
              <FaHeart className="text-red-500 animate-pulse" />
              <span>by</span>
              <a 
                href="https://welltechnologies.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:text-accent/80 transition-colors hover:underline"
              >
                Well Technologies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}