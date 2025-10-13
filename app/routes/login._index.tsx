import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";

export const meta: MetaFunction = () => ([
  { title: "Login | Éclectique by KMC" },
  { name: "description", content: "Accede a tu cuenta para gestionar pedidos y preferencias." },
]);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      if (!res.ok) {
        let msg = await res.text();
        try { const j = JSON.parse(msg); msg = j.detail || msg; } catch {}
        throw new Error(msg || "Error de login");
      }
      const data = await res.json();
      // The backend sets the auth_token cookie automatically with credentials: 'include'
      // No need to store anything in localStorage since we're using secure HttpOnly cookies
      navigate("/cuenta"); // Redirect to account page after successful login
    } catch (err: any) {
      setError(err?.message || "Error de login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-2 text-sm text-gray-600">Accede con tu email y contraseña.</p>
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Contraseña" required />
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <button className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-3 text-sm text-gray-600">
        <a href="/olvide" className="text-accent hover:underline">¿Olvidaste tu contraseña?</a>
      </p>
    </main>
  );
}
