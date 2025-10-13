import React, { useState } from 'react';

interface HeroEclectiqueProps {
  className?: string;
}

const HeroEclectique: React.FC<HeroEclectiqueProps> = ({ className = '' }) => {
  const [language, setLanguage] = useState('en');

  const content = {
    en: {
      title: "Your daily style, curated",
      subtitle: "Discover beauty, fashion and accessories thoughtfully chosen to elevate your everyday",
      cta: "Shop the edit",
      trust: "Affiliate links included • Earnings from qualifying purchases"
    },
    es: {
      title: "Tu estilo, curado a diario",
      subtitle: "Descubre belleza, moda y accesorios cuidadosamente elegidos para elevar tu día a día",
      cta: "Comprar la selección",
      trust: "Enlaces de afiliados incluidos • Ganancias de compras calificadas"
    }
  };

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (typeof document !== 'undefined') {
      const target = document.querySelector('#featured-products');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <style>{`
        :root {
          --color-primary: #2c2c2c;
          --color-secondary: #d4af37;
          --color-accent: #f8f6f0;
          --color-text: #333333;
          --color-text-light: #666666;
          --color-background: #ffffff;
          --color-neutral: #f5f5f5;
        }

        .theme-dark {
          --color-primary: #1a1a1a;
          --color-secondary: #c9a961;
          --color-accent: #2a2a2a;
          --color-text: #e5e5e5;
          --color-text-light: #b8b8b8;
          --color-background: #0f0f0f;
          --color-neutral: #252525;
        }

        .hero-eclectique {
          min-height: 70vh;
          display: flex;
          align-items: center;
          padding: 3rem 1rem;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
          border-bottom: 1px solid #e5e5e5;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: center;
        }

        .hero-image {
          order: 1;
          text-align: center;
        }

        .hero-image img {
          width: 100%;
          max-width: 500px;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          object-fit: cover;
          aspect-ratio: 4/5;
        }

        .hero-content {
          order: 2;
          text-align: center;
        }

        .language-toggle {
          margin-bottom: 1.5rem;
        }

        .lang-btn {
          background: none;
          border: 1px solid var(--color-text-light);
          color: var(--color-text-light);
          padding: 0.5rem 1rem;
          margin: 0 0.25rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          min-width: 44px;
          min-height: 44px;
        }

        .lang-btn.active {
          background-color: var(--color-secondary);
          color: var(--color-background);
          border-color: var(--color-secondary);
        }

        .lang-btn:hover,
        .lang-btn:focus {
          background-color: var(--color-secondary);
          color: var(--color-background);
          border-color: var(--color-secondary);
          outline: 2px solid var(--color-secondary);
          outline-offset: 2px;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1rem;
          color: var(--color-primary);
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--color-text-light);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-secondary);
          color: var(--color-background);
          text-decoration: none;
          padding: 1rem 2rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          min-width: 44px;
          min-height: 44px;
          margin-bottom: 1rem;
        }

        .hero-cta:hover,
        .hero-cta:focus {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
          outline: 2px solid var(--color-secondary);
          outline-offset: 2px;
        }

        .trust-copy {
          font-size: 0.75rem;
          color: var(--color-text-light);
          opacity: 0.9;
          font-style: italic;
          margin-top: 0.5rem;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .hero-container {
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
          }

          .hero-image {
            order: 1;
            text-align: left;
          }

          .hero-image img {
            aspect-ratio: 3/2;
            max-width: 600px;
          }

          .hero-content {
            order: 2;
            text-align: left;
          }

          .hero-title {
            font-size: 3.5rem;
          }

          .hero-subtitle {
            font-size: 1.25rem;
            margin-left: 0;
            margin-right: 0;
          }

          .language-toggle {
            text-align: left;
          }
        }

        @media (min-width: 1200px) {
          .hero-title {
            font-size: 4rem;
          }
        }

        /* Breakpoints específicos */
        @media (max-width: 360px) {
          .hero-title {
            font-size: 2rem;
          }
          .hero-subtitle {
            font-size: 1rem;
          }
        }

        /* Accesibilidad */
        @media (prefers-reduced-motion: reduce) {
          .hero-cta {
            transition: none;
          }
          .hero-cta:hover {
            transform: none;
          }
        }
      `}</style>
      
      <section className={`hero-eclectique ${className}`} role="banner">
        <div className="hero-container">
          <div className="hero-image">
            <img 
              src="/images/hero-1.webp" 
              alt="Curated fashion and beauty products arranged aesthetically"
              width="500" 
              height="600"
              loading="eager"
            />
          </div>
          <div className="hero-content">
            <nav className="language-toggle" aria-label="Language selection">
              <button 
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button 
                className={`lang-btn ${language === 'es' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('es')}
                aria-label="Cambiar a Español"
              >
                ES
              </button>
            </nav>

            <h1 className="hero-title">
              {content[language].title}
            </h1>
            <p className="hero-subtitle">
              {content[language].subtitle}
            </p>
            
            <a 
              href="#featured-products"
              className="hero-cta"
              onClick={handleCtaClick}
              aria-describedby="trust-copy"
            >
              {content[language].cta}
            </a>
            
            <p className="trust-copy" id="trust-copy">
              {content[language].trust}
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroEclectique;