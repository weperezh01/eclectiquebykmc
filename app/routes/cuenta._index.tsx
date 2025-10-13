import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { 
  FaUser, 
  FaLock, 
  FaCamera, 
  FaCog, 
  FaTrash, 
  FaEye, 
  FaEyeSlash,
  FaCheck,
  FaExclamationTriangle,
  FaSignOutAlt
} from "react-icons/fa";

export const meta: MetaFunction = () => ([
  { title: "Mi Cuenta | Éclectique by KMC" },
  { name: "description", content: "Gestiona tu perfil, configuración y preferencias en Éclectique by KMC" }
]);

export default function Cuenta() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  // Perfil: formulario controlado
  const [form, setForm] = useState({
    name: "",
    apellido: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    genero: "",
    newsletter: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPw, setChangingPw] = useState(false);

  // Danger zone
  const [deleting, setDeleting] = useState(false);

  const toInputDate = (v?: any) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("Cargando usuario...");
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });

        console.log("Response status:", response.status);
        
        if (response.status === 401) {
          console.log("Usuario no autenticado, redirigiendo...");
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Usuario cargado:", data);
        setUser(data);
        setError("");

      } catch (err: any) {
        console.error("Error cargando usuario:", err);
        setError(err.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Inicializar formulario cuando llega el usuario
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.nombre || user.name || "",
      apellido: user.apellido || "",
      email: user.email || "",
      telefono: user.telefono || "",
      fecha_nacimiento: toInputDate(user.fecha_nacimiento || user.fechaNacimiento),
      genero: user.genero || "",
      newsletter: !!user.newsletter_subscribed,
    });
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setProfileMsg(null);
      const payload: any = {
        name: form.name,
        apellido: form.apellido,
        telefono: form.telefono || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        genero: form.genero || null,
        newsletter_subscribed: form.newsletter,
      };
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || "No se pudo guardar");
      }
      setUser(data);
      setProfileMsg({ type: "success", text: "Cambios guardados correctamente" });
    } catch (e: any) {
      setProfileMsg({ type: "error", text: e.message || "Error guardando cambios" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      setAvatarMsg({ type: "error", text: "Selecciona un archivo primero" });
      return;
    }
    try {
      setUploadingAvatar(true);
      setAvatarMsg(null);
      const fd = new FormData();
      fd.append("file", avatarFile);
      const res = await fetch("/api/auth/me/avatar", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || data.error || "No se pudo subir el avatar");
      setUser(data);
      setAvatarFile(null);
      setAvatarMsg({ type: "success", text: "Avatar actualizado" });
    } catch (e: any) {
      setAvatarMsg({ type: "error", text: e.message || "Error subiendo avatar" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw) {
      setPwMsg({ type: "error", text: "Completa las contraseñas" });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ type: "error", text: "La nueva contraseña debe tener mínimo 8 caracteres" });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    try {
      setChangingPw(true);
      const res = await fetch("/api/auth/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || data.error || "No se pudo cambiar la contraseña");
      setPwMsg({ type: "success", text: "Contraseña cambiada exitosamente" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e: any) {
      setPwMsg({ type: "error", text: e.message || "Error cambiando contraseña" });
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm("¿Seguro que deseas eliminar tu cuenta? Esta acción es permanente.");
    if (!ok) return;
    try {
      setDeleting(true);
      const res = await fetch("/api/auth/me", { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || data.error || "No se pudo eliminar la cuenta");
      window.location.href = "/";
    } catch (e: any) {
      alert(e.message || "Error eliminando la cuenta");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "/";
    }
  };

  // Si está cargando
  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </main>
    );
  }

  // Si hay error
  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error al cargar perfil</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-2"
            >
              🔄 Reintentar
            </button>
            <button 
              onClick={() => window.location.href = "/login"}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 mx-2"
            >
              ← Volver al Login
            </button>
          </div>
          
          {/* Debug info */}
          <div className="mt-8 text-left max-w-2xl mx-auto">
            <details className="bg-gray-100 p-4 rounded">
              <summary className="cursor-pointer font-medium">🔍 Información de Debug</summary>
              <div className="mt-4 space-y-2 text-sm font-mono">
                <p><strong>Error:</strong> {error}</p>
                <p><strong>URL:</strong> {window.location.href}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
                <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              </div>
            </details>
          </div>
        </div>
      </main>
    );
  }

  // Si no hay usuario después de cargar
  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sin datos de usuario</h1>
          <p className="text-gray-600 mb-6">No se encontraron datos de usuario.</p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Ir al Login
          </button>
        </div>
      </main>
    );
  }

  // Renderizar perfil
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Cuenta</h1>
        <p className="text-gray-600">Gestiona tu perfil y configuración personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <section className="lg:col-span-2 space-y-8">
          {/* Información Personal */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FaUser className="text-gray-500" />
              <h2 className="text-lg font-semibold">Información Personal</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Administrador"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Sistema"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700"
                  title="No editable"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                  placeholder="mm/dd/yyyy"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                <select
                  value={form.genero}
                  onChange={(e) => setForm({ ...form, genero: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="">Seleccionar…</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="newsletter"
                  type="checkbox"
                  checked={form.newsletter}
                  onChange={(e) => setForm({ ...form, newsletter: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="newsletter" className="text-sm text-gray-700">
                  Quiero recibir noticias y ofertas especiales por email
                </label>
              </div>
            </div>

            {profileMsg && (
              <div className={`mt-4 rounded-md border p-3 text-sm ${profileMsg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                {profileMsg.text}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-white hover:bg-black/90 disabled:opacity-60"
              >
                {savingProfile ? 'Guardando…' : 'Guardar Cambios'}
              </button>
            </div>
          </div>

          {/* Cambiar Contraseña */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FaLock className="text-gray-500" />
              <h2 className="text-lg font-semibold">Cambiar Contraseña</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                <div className="relative">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                  <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })} className="absolute inset-y-0 right-2 flex items-center text-gray-500">
                    {showPw.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña (mínimo 8 caracteres)</label>
                <div className="relative">
                  <input
                    type={showPw.new ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                  <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })} className="absolute inset-y-0 right-2 flex items-center text-gray-500">
                    {showPw.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                  <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute inset-y-0 right-2 flex items-center text-gray-500">
                    {showPw.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            {pwMsg && (
              <div className={`mt-4 rounded-md border p-3 text-sm ${pwMsg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                {pwMsg.text}
              </div>
            )}
            <div className="mt-4">
              <button onClick={handleChangePassword} disabled={changingPw} className="rounded-md bg-black px-4 py-2 text-white hover:bg-black/90 disabled:opacity-60">
                {changingPw ? 'Cambiando…' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>
        </section>

        {/* Columna lateral */}
        <aside className="space-y-8">
          {/* Avatar */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FaCamera className="text-gray-500" />
              <h2 className="text-lg font-semibold">Avatar</h2>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {user.avatar_url || user.avatar ? (
                  <img src={user.avatar_url || user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <FaUser className="text-gray-500" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">{user.nombre || user.name || 'Usuario'}</div>
                <div className="text-gray-500">{user.email}</div>
                <div className="text-gray-400">ID: #{user.id}</div>
              </div>
            </div>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700" />
            {avatarMsg && (
              <div className={`mt-3 rounded-md border p-2 text-xs ${avatarMsg.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{avatarMsg.text}</div>
            )}
            <div className="mt-3">
              <button onClick={handleUploadAvatar} disabled={uploadingAvatar} className="rounded-md bg-black px-4 py-2 text-white hover:bg-black/90 disabled:opacity-60">
                {uploadingAvatar ? 'Subiendo…' : 'Subir'}
              </button>
            </div>
          </div>

          {/* Cuenta */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FaCog className="text-gray-500" />
              <h2 className="text-lg font-semibold">Cuenta</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Miembro desde:</span><span className="font-medium">{(user.created_at || user.fechaCreacion) ? new Date(user.created_at || user.fechaCreacion).toLocaleDateString('es-ES') : 'No disponible'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">ID de cuenta:</span><span className="font-mono">{user.id}</span></div>
            </div>
          </div>

          {/* Zona Peligrosa */}
          <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <FaExclamationTriangle className="text-red-600" />
              <h2 className="text-lg font-semibold text-red-700">Zona Peligrosa</h2>
            </div>
            <div className="space-y-4">
              <button onClick={handleDeleteAccount} disabled={deleting} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60">
                <FaTrash /> {deleting ? 'Eliminando…' : 'Eliminar mi cuenta'}
              </button>
              <p className="text-sm text-red-700">Una vez eliminada tu cuenta, no hay vuelta atrás. Esta acción es permanente.</p>
              <button onClick={handleLogout} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900">
                <FaSignOutAlt /> Cerrar sesión en este dispositivo
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Debug Info */}
      <div className="mt-10">
        <details className="bg-gray-50 p-4 rounded-lg">
          <summary className="cursor-pointer font-medium text-gray-700">🔍 Datos del Usuario (Debug)</summary>
          <pre className="mt-4 text-xs bg-gray-800 text-green-400 p-4 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </div>
    </main>
  );
}
