import type { AffiliateItem } from "../types/affiliate";

export default function AffiliateCard({ item }: { item: AffiliateItem }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <a href={item.url} target="_blank" rel="nofollow sponsored noopener noreferrer">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-gray-100">
          {item.image ? (
            <img src={item.image} alt={item.title} className="h-full w-full object-cover"/>
          ) : null}
        </div>
      </a>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
        {item.price ? (
          <p className="mt-1 text-sm text-gray-600">{item.currency ?? "USD"} {item.price.toFixed(2)}</p>
        ) : null}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">{item.platform}</span>
          <a
            href={item.url}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Ver en {item.platform}
          </a>
        </div>
      </div>
    </article>
  );
}

