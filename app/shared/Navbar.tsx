import { Link, NavLink, useLocation, useNavigate } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

const baseNav = [
  { to: "/", label: "Home" },
  { to: "/tiendas", label: "Shops" },
  { to: "/afiliados", label: "Affiliates" },
  // { to: "/marketplaces", label: "Marketplaces" }, // ocultado a solicitud
  { to: "/otras-plataformas", label: "Other platforms" },
  { to: "/guias", label: "Guides" },
  { to: "/sobre", label: "About" },
  { to: "/contacto", label: "Contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [me, setMe] = useState<{ email?: string; name?: string; avatar_url?: string; avatar_thumb_url?: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setUserMenuOpen(false);
      }
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Cerrar al navegar
  useEffect(() => {
    setOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check authentication using cookie-based API call instead of localStorage
      fetch("/api/auth/me", { credentials: 'include' })
        .then(async (r) => {
          if (r.ok) {
            const info = await r.json();
            setAuthed(true);
            const isAdmin = Boolean(info?.is_admin || info?.rol === 'admin' || (Array.isArray(info?.roles) && info.roles.includes('admin')));
            setIsAdmin(isAdmin);
            setMe({ 
              email: info?.email, 
              name: info?.name || info?.nombre, 
              avatar_url: info?.avatar_url, 
              avatar_thumb_url: info?.avatar_thumb_url 
            });
          } else {
            // Not authenticated
            setAuthed(false);
            setIsAdmin(false);
            setMe(null);
          }
        })
        .catch(() => {
          // Error - not authenticated
          setAuthed(false);
          setIsAdmin(false);
          setMe(null);
        });
    }
  }, [pathname]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      try {
        // Call backend logout endpoint to clear server-side session
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.warn("Error during logout:", e);
      } finally {
        // Always update local state and redirect regardless of logout endpoint result
        setAuthed(false);
        setIsAdmin(false);
        setMe(null);
        navigate("/");
      }
    }
  };

  // Cerrar menú usuario al hacer click fuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const initials = (() => {
    const n = me?.name?.trim();
    if (n && n.length > 0) {
      const parts = n.split(/\s+/).slice(0, 2);
      return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "U";
    }
    const e = me?.email || "";
    return e ? e.charAt(0).toUpperCase() : "U";
  })();

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-black/10 bg-white/80 backdrop-blur overflow-visible">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="font-extrabold tracking-tight">
            Éclectique <span className="text-accent">by KMC</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 text-sm md:flex">
            {baseNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `hover:text-accent ${
                    isActive || (item.to !== "/" && pathname.startsWith(item.to))
                      ? "text-black"
                      : "text-gray-600"
                  }`
                }
                prefetch="intent"
              >
                {item.label}
              </NavLink>
            ))}
            {!authed ? (
              <>
                {/* Login y registro ocultos por solicitud del usuario */}
                {/* <NavLink to="/login" prefetch="intent" className={({ isActive }) => `hover:text-accent ${isActive ? "text-black" : "text-gray-600"}`}>
                  Login
                </NavLink>
                <NavLink to="/registro" prefetch="intent" className={({ isActive }) => `hover:text-accent ${isActive ? "text-black" : "text-gray-600"}`}>
                  Register
                </NavLink> */}
              </>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-black ring-1 ring-black/10 hover:opacity-90 overflow-hidden"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                >
                  {me?.avatar_thumb_url || me?.avatar_url ? (
                    <img src={me.avatar_thumb_url || me.avatar_url!} alt="Avatar" className="h-8 w-8 object-cover" />
                  ) : (
                    <span className="text-xs font-semibold">{initials}</span>
                  )}
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-black/20 bg-white py-1 text-sm shadow-xl z-[80]">
                    <div className="px-3 py-1 text-gray-500">{me?.email || "Account"}</div>
                    <Link to="/cuenta" className="block px-3 py-1 hover:bg-black/5">My account</Link>
                    {isAdmin ? <Link to="/admin" className="block px-3 py-1 hover:bg-black/5">Admin</Link> : null}
                    <div className="my-1 border-t border-black/10" />
                    <button onClick={handleLogout} className="block w-full px-3 py-1 text-left text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                ) : null}
              </div>
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            ref={btnRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-md border border-black/10 bg-white/70 px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-white z-50"
          >
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {open ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu (overlay + slide-in panel) - MOVED OUTSIDE HEADER */}
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 transition-opacity duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobileMenuTitle"
            className={`absolute top-0 right-0 h-full w-11/12 max-w-xs bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
            <h2 id="mobileMenuTitle" className="text-sm font-semibold tracking-wide">Menu</h2>
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-2 py-1 text-gray-700 hover:bg-black/5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User summary (solo cuando hay sesión) */}
          {authed ? (
            <div className="px-4 py-3 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-accent text-black ring-1 ring-black/10 flex items-center justify-center">
                  {me?.avatar_thumb_url || me?.avatar_url ? (
                    <img src={me.avatar_thumb_url || me.avatar_url!} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{me?.name || "User"}</div>
                  <div className="truncate text-xs text-gray-600">{me?.email}</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Main nav (vertical list, includes account actions) */}
          <nav aria-label="Main mobile navigation" className="flex-1 px-3 py-4">
            <ul className="space-y-2">
              {baseNav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    prefetch="intent"
                    className={({ isActive }) =>
                      `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        isActive || (item.to !== "/" && pathname.startsWith(item.to))
                          ? "bg-accent/10 text-black border-l-4 border-accent"
                          : "text-gray-700 hover:bg-gray-50 hover:text-black"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}

              {authed ? (
                <>
                  <li className="border-t border-gray-200 pt-2 mt-4">
                    <div className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      Account
                    </div>
                  </li>
                  {isAdmin ? (
                    <li>
                      <Link to="/admin" className="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                        Admin
                      </Link>
                    </li>
                  ) : null}
                  <li>
                    <Link to="/cuenta" className="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors">
                      My account
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50 transition-colors">
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  {/* Sección de login y registro oculta por solicitud del usuario */}
                  {/* <li className="border-t border-gray-200 pt-2 mt-4">
                    <div className="px-4 py-2 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                      Session
                    </div>
                  </li>
                  <li>
                    <NavLink to="/login" prefetch="intent" className={({ isActive }) => `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${isActive ? "bg-accent/10 text-black border-l-4 border-accent" : "text-gray-700 hover:bg-gray-50 hover:text-black"}`}>
                      Login
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/registro" prefetch="intent" className={({ isActive }) => `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${isActive ? "bg-accent/10 text-black border-l-4 border-accent" : "text-gray-700 hover:bg-gray-50 hover:text-black"}`}>
                      Create account
                    </NavLink>
                  </li> */}
                </>
              )}
            </ul>
          </nav>
        </aside>
        </div>
      )}
    </>
  );
}
