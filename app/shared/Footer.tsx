import { LINKS } from "../data/links";
import { FaInstagram, FaTiktok, FaPinterest, FaBagShopping, FaStore, FaLink, FaFacebook } from "react-icons/fa6";
import { SiEbay, SiWalmart } from "react-icons/si";
import MarketplaceIcon from "../components/MarketplaceIcon";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <div>
          <p>© {new Date().getFullYear()} Éclectique by KMC</p>
          <p className="mt-1 text-xs text-gray-500">
            Some links are affiliate links. As Amazon Associates we earn from qualifying purchases, at no extra cost to you.
            <span className="ml-2">
              <a href="/privacy" className="hover:text-accent">Privacy</a> · <a href="/terms" className="hover:text-accent">Terms</a>
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        {/* Redes sociales */}
        <a
          href={LINKS.instagram}
          aria-label="Instagram"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition"
          title="Instagram"
        >
          <FaInstagram size={18} />
        </a>
        <a
          href="https://www.facebook.com/kari.cruz.543"
          aria-label="Facebook"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white transition"
          title="Facebook"
        >
          <FaFacebook size={18} />
        </a>
          {/* Marketplaces / tiendas rápidas */}
          <a
            href={LINKS.ebay}
            aria-label="eBay"
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="p-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white transition"
            title="eBay"
          >
            <SiEbay size={18} />
          </a>
          <a
            href={LINKS.mercari}
            aria-label="Mercari"
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
            title="Mercari"
          >
            <FaBagShopping size={18} />
          </a>
          <a
            href={LINKS.poshmark}
            aria-label="Poshmark"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition"
            title="Poshmark"
          >
            <FaStore size={18} />
          </a>
          {/* Otros marketplaces / escaparates */}
          {LINKS.amazon_storefront && (
            <a
              href={LINKS.amazon_storefront}
              aria-label="Amazon Storefront"
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="p-2 rounded-full bg-amber-500 hover:bg-amber-600 text-black transition"
              title="Amazon Storefront"
            >
              <MarketplaceIcon marketplace="Amazon" size={18} />
            </a>
          )}
          {LINKS.ltk && (
            <a
              href={LINKS.ltk}
              aria-label="LTK"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-black hover:bg-gray-800 text-white transition"
              title="LTK"
            >
              <MarketplaceIcon marketplace="LTK" size={18} />
            </a>
          )}
          {LINKS.tiktok_showcase && (
            <a
              href={LINKS.tiktok_showcase}
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-black hover:bg-gray-800 text-white transition"
              title="TikTok"
            >
              <FaTiktok size={18} />
            </a>
          )}
          {LINKS.walmart && (
            <a
              href={LINKS.walmart}
              aria-label="Walmart"
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition"
              title="Walmart"
            >
              <MarketplaceIcon marketplace="Walmart" size={18} />
            </a>
          )}
          {LINKS.pinterest && (
            <a
              href={LINKS.pinterest}
              aria-label="Pinterest"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition"
              title="Pinterest"
            >
              <FaPinterest size={18} />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
