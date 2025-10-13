import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";

export const meta: MetaFunction = () => ([
  { title: "Olvidé mi contraseña | Éclectique by KMC" },
]);

export default function Olvide() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null); setDevLink(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMsg("Si tu email existe, te enviamos un enlace de restablecimiento.");
      if ((data as any)?.reset_link) setDevLink((data as any).reset_link);
    } catch (e: any) {
      setErr(e?.message || "No se pudo procesar la solicitud");
    } finally { setLoading(false); }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Olvidé mi contraseña</h1>
      <p className="mt-2 text-sm text-gray-600">Ingresa tu email para enviarte un enlace de restablecimiento.</p>
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Email" required />
        {msg ? <div className="text-sm text-green-700">{msg}</div> : null}
        {err ? <div className="text-sm text-red-600">{err}</div> : null}
        {devLink ? <div className="text-xs text-gray-600">Enlace (dev): <a className="text-accent hover:underline" href={devLink}>{devLink}</a></div> : null}
        <button className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </main>
  );
}

