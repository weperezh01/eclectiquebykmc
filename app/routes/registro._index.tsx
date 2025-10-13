import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";

export const meta: MetaFunction = () => ([
  { title: "Registro | Éclectique by KMC" },
  { name: "description", content: "Crea tu cuenta para guardar favoritos y seguir pedidos." },
]);

export default function Registro() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include'
      });
      if (!res.ok) {
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.detail || msg; } catch {}
        throw new Error(msg || "Error de registro");
      }
      const data = await res.json();
      // The backend sets the auth_token cookie automatically with credentials: 'include'
      // No need to store anything in localStorage since we're using secure HttpOnly cookies
      setOk("Cuenta creada correctamente");
      navigate("/cuenta"); // Redirect to account page after successful registration
    } catch (err: any) {
      setError(err?.message || "Error de registro");
    } finally {
      setLoading(false);
    }
  };

  const validPw = password.length >= 8;
  const match = password === confirm;
  const canSubmit = !!email && validPw && match && !loading;

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Registro</h1>
      <p className="mt-2 text-sm text-gray-600">Crea tu cuenta con email y contraseña (mínimo 8 caracteres).</p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Nombre" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Contraseña (mín. 8)" required />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Confirmar contraseña" required />
        {!validPw ? <div className="text-xs text-amber-600">La contraseña debe tener al menos 8 caracteres.</div> : null}
        {!match ? <div className="text-xs text-amber-600">Las contraseñas no coinciden.</div> : null}
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {ok ? <div className="text-sm text-green-700">{ok}</div> : null}
        <button className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={!canSubmit}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-3 text-sm text-gray-600">
        ¿Ya tienes cuenta? <a href="/login" className="text-accent hover:underline">Inicia sesión</a>
      </p>
    </main>
  );
}
