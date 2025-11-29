import React from "react";
import MarketplaceIcon from "./MarketplaceIcon";

type Props = {
  title: string;
  image: string;
  href: string;
  label?: string;
  note?: string;
  tags?: string[];
  productType?: 'afiliado' | 'propio';
  productId?: string | number;
};

export default function Card({ title, image, href, label = "Ver", note, tags, productType, productId }: Props) {
  // Detect marketplace from URL
  const getMarketplaceFromUrl = (url: string): string => {
    if (url.includes('amazon.com') || url.includes('amzn.to')) return 'Amazon';
    if (url.includes('walmart.com') || url.includes('walmrt.us')) return 'Walmart';
    if (url.includes('shopltk.com')) return 'LTK';
    if (url.includes('ebay.com')) return 'eBay';
    if (url.includes('shein.com')) return 'Shein';
    if (url.includes('mercari.com')) return 'Mercari';
    if (url.includes('poshmark.com')) return 'Poshmark';
    return '';
  };

  const marketplace = getMarketplaceFromUrl(href);
  
  // For own products, use internal link instead of external
  const isOwnProduct = productType === 'propio';
  const finalHref = isOwnProduct && productId ? `/productos/${productId}` : href;
  const targetAttr = isOwnProduct ? undefined : "_blank";
  const relAttr = isOwnProduct ? undefined : "nofollow sponsored noopener noreferrer";

  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md focus-within:shadow-md">
      <a href={finalHref} target={targetAttr} rel={relAttr} className="block">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
          <img src={image} alt={title} loading="lazy" className="max-h-full max-w-full object-contain" />
        </div>
      </a>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{title}</h3>
        {tags && tags.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {note ? <p className="mt-1 text-sm text-gray-600 line-clamp-2">{note}</p> : null}
        <div className="mt-3">
          <a href={finalHref} target={targetAttr} rel={relAttr} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light">
            {isOwnProduct ? (
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : marketplace ? (
              <MarketplaceIcon 
                marketplace={marketplace} 
                size={16} 
                className="flex-shrink-0"
              />
            ) : null}
            {isOwnProduct ? "Ver Detalles" : label}
          </a>
        </div>
      </div>
    </article>
  );
}
