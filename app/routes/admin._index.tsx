import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";

type User = {
  id: number;
  name?: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
};

export const meta: MetaFunction = () => ([
  { title: "Admin | Éclectique by KMC" },
]);

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<number | null>(null);
  const [demoting, setDemoting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.detail || msg; } catch {}
        throw new Error(msg || `Error ${res.status}`);
      }
      const data = (await res.json()) as User[];
      setUsers(data);
    } catch (e: any) {
      setError(e?.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Guard: ensure admin before loading list
    setVerifying(true);
    
    // Add a small delay to ensure Navbar auth check completes first
    setTimeout(() => {
      fetch("/api/auth/me", { credentials: 'include' })
        .then(async (r) => {
          if (r.ok) {
            const me = await r.json();
            if (me?.rol !== 'admin') {
              navigate("/");
            } else {
              setVerifying(false);
              loadUsers();
            }
          } else {
            navigate("/login");
          }
        })
        .catch(() => {
          navigate("/login");
        });
    }, 100);
  }, []);

  const promote = async (id: number) => {
    setPromoting(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/promote`, {
        method: "POST",
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.detail || msg; } catch {}
        throw new Error(msg || `Error ${res.status}`);
      }
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "No se pudo promover");
    } finally {
      setPromoting(null);
    }
  };

  const demote = async (id: number) => {
    if (!confirm('¿Quitar privilegios de admin a este usuario?')) return;
    setDemoting(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/demote`, {
        method: "POST",
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.detail || msg; } catch {}
        throw new Error(msg || `Error ${res.status}`);
      }
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "No se pudo despromover");
    } finally {
      setDemoting(null);
    }
  };

  const toggleActive = async (id: number, value: boolean) => {
    if (!confirm(value ? '¿Activar este usuario?' : '¿Desactivar este usuario?')) return;
    setToggling(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: value }),
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.detail || msg; } catch {}
        throw new Error(msg || `Error ${res.status}`);
      }
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "No se pudo actualizar estado");
    } finally {
      setToggling(null);
    }
  };

  if (verifying) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-6 text-sm text-gray-600">Verificando permisos de administrador...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="mt-2 text-sm text-gray-600">Gestión básica de usuarios.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin/products" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-black/5">Gestionar productos</a>
        </div>
      </div>
      {error ? <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}
      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Cargando...</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2">Admin</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="px-3 py-2">{u.id}</td>
                  <td className="px-3 py-2">{u.name || "—"}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded-md px-3 py-1 text-white disabled:opacity-50"
                      style={{ backgroundColor: u.is_active ? '#666' : '#16a34a' }}
                      onClick={() => toggleActive(u.id, !u.is_active)}
                      disabled={toggling === u.id}
                    >
                      {toggling === u.id ? "Actualizando..." : u.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                  <td className="px-3 py-2">{u.is_admin ? "Sí" : "No"}</td>
                  <td className="px-3 py-2 space-x-2">
                    {!u.is_admin ? (
                      <button
                        className="rounded-md bg-primary px-3 py-1 text-white disabled:opacity-50"
                        onClick={() => promote(u.id)}
                        disabled={promoting === u.id}
                      >
                        {promoting === u.id ? "Promoviendo..." : "Promover"}
                      </button>
                    ) : (
                      <button
                        className="rounded-md bg-amber-600 px-3 py-1 text-white disabled:opacity-50"
                        onClick={() => demote(u.id)}
                        disabled={demoting === u.id}
                      >
                        {demoting === u.id ? "Quitando..." : "Quitar admin"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
