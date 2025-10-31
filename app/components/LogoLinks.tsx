import React from "react";
import MarketplaceIcon from "./MarketplaceIcon";
import { FaTiktok } from "react-icons/fa6";

type Item = { readonly name: string; readonly logo: string; readonly href: string; readonly blurb?: string };

export default function LogoLinks({ items }: { items: readonly Item[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {items.map((i) => (
        <a
          key={i.name}
          href={i.href}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:shadow-sm"
        >
          {i.name.toLowerCase() === 'amazon' ? (
            <MarketplaceIcon marketplace="Amazon" size={28} className="flex-shrink-0" />
          ) : i.name.toLowerCase() === 'ltk' ? (
            <MarketplaceIcon marketplace="LTK" size={28} className="flex-shrink-0" />
          ) : i.name.toLowerCase() === 'shein' ? (
            <MarketplaceIcon marketplace="Shein" size={28} className="flex-shrink-0" />
          ) : i.name.toLowerCase() === 'tiktok' ? (
            <FaTiktok size={28} className="flex-shrink-0 text-black" />
          ) : (
            <img src={i.logo} alt={`${i.name} logo`} loading="lazy" className="h-7 w-7 object-contain" />
          )}
          <div>
            <div className="font-medium leading-none group-hover:text-accent">{i.name}</div>
            {i.blurb ? <div className="text-xs text-gray-600">{i.blurb}</div> : null}
          </div>
        </a>
      ))}
    </div>
  );
}

