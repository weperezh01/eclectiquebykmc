import type { MetaFunction } from "@remix-run/node";
import { useSearchParams, useNavigate } from "@remix-run/react";
import { useState } from "react";

export const meta: MetaFunction = () => ([
  { title: "Restablecer contraseña | Éclectique by KMC" },
]);

export default function Restablecer() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setErr(null);
    if (newPw.length < 8) { setErr("La contraseña debe tener al menos 8 caracteres"); return; }
    if (newPw !== confirmPw) { setErr("Las contraseñas no coinciden"); return; }
    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPw }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Contraseña actualizada. Ahora puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (e: any) {
      setErr(e?.message || "No se pudo restablecer contraseña");
    } finally { setLoading(false); }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
      <p className="mt-2 text-sm text-gray-600">Crea una nueva contraseña y confírmala.</p>
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Nueva contraseña (min. 8)" required />
        <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full rounded-md border border-gray-300 px-4 py-3" placeholder="Confirmar contraseña" required />
        {msg ? <div className="text-sm text-green-700">{msg}</div> : null}
        {err ? <div className="text-sm text-red-600">{err}</div> : null}
        <button className="rounded-md bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </main>
  );
}

