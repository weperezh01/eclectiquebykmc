import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import styles from "./styles/tailwind.css?url";
import Navbar from "./shared/Navbar";
import Footer from "./shared/Footer";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "canonical", href: "https://eclectiquebykmc.com/" },
];

export const meta: MetaFunction = () => ([
  { title: "Éclectique by KMC" },
  {
    name: "description",
    content:
      "Eclectic selection of vintage accessories, premium travel cosmetics, and carefully curated recommendations.",
  },
  { name: "theme-color", content: "#1a1a1a" },
  { property: "og:title", content: "Éclectique by KMC" },
  { property: "og:description", content: "Eclectic selection of vintage accessories, premium travel cosmetics, and carefully curated recommendations." },
  { property: "og:type", content: "website" },
  { property: "og:url", content: "https://eclectiquebykmc.com/" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: "Éclectique by KMC" },
  { name: "twitter:description", content: "Eclectic selection of vintage accessories, premium travel cosmetics, and carefully curated recommendations." },
]);

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full bg-white text-gray-900">
        <Navbar />
        <Outlet />
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
