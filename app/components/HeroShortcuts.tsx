import React from "react";

export function HeroShortcuts() {
  const links = [
    { href: "/afiliados",         label: "Shop looks",      kind: "primary" },
    { href: "/tiendas",           label: "Shops" },
    { href: "/afiliados",         label: "Affiliates" },
    { href: "/otras-plataformas", label: "Other platforms" },
    { href: "/guias",             label: "Guides" },
  ];
  
  return (
    <>
      <style>{`
        .hero-shortcuts {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          margin-top: 18px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 22px;
          border-radius: 16px;
          border: 1px solid transparent;
          text-decoration: none;
          font-weight: 600;
          line-height: 1;
          color: #333333;
          transition: transform .08s ease, box-shadow .2s ease, background-color .2s ease, border-color .2s ease;
          min-height: 44px;
          min-width: 44px;
          font-size: 14px;
        }

        .btn:focus {
          outline: 2px solid #333333;
          outline-offset: 2px;
        }

        .btn:active { 
          transform: translateY(1px); 
        }

        .btn--primary {
          background: #d4af37;
          color: #111;
          box-shadow: 0 1px 2px rgba(0,0,0,.25), 0 6px 16px rgba(0,0,0,.25);
        }

        .btn--primary:hover { 
          filter: brightness(0.96); 
        }

        .btn--ghost {
          background: transparent;
          border-color: rgba(0,0,0,.2);
          color: #333333;
        }

        .btn--ghost:hover {
          border-color: rgba(0,0,0,.35);
          background: rgba(0,0,0,.08);
        }

        @media (max-width: 480px) {
          .hero-shortcuts { 
            gap: 12px; 
          }
          
          .btn { 
            padding: 12px 18px; 
            border-radius: 14px; 
            font-size: 13px;
          }
        }
      `}</style>
      
      <nav className="hero-shortcuts" aria-label="Primary shortcuts">
        {links.map((l, index) => (
          <a
            key={`${l.href}-${index}`}
            href={l.href}
            className={`btn ${l.kind === "primary" ? "btn--primary" : "btn--ghost"}`}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </>
  );
}

export default HeroShortcuts;