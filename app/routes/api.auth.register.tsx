import { json, type ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Validar que el body sea válido
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return json(
        { error: "Datos de solicitud inválidos" }, 
        { status: 400 }
      );
    }

    // Validar campos requeridos
    if (!body.email || !body.password || !body.name) {
      return json(
        { error: "Nombre, email y contraseña son requeridos" }, 
        { status: 400 }
      );
    }

    // Adaptar los campos para el backend Express
    const backendData = {
      email: body.email,
      password: body.password,
      nombre: body.name // El backend espera 'nombre' en lugar de 'name'
    };

    // Validaciones básicas
    if (body.password.length < 8) {
      return json(
        { error: "La contraseña debe tener al menos 8 caracteres" }, 
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return json(
        { error: "Email inválido" }, 
        { status: 400 }
      );
    }
    
    // Determinar la URL del backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';
    
    console.log(`[AUTH] Intentando registro para: ${body.email}`);
    console.log(`[AUTH] Datos enviados al backend:`, backendData);
    
    // Hacer la llamada al backend con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Pasar la respuesta tal cual (incluye Set-Cookie)
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("[AUTH] Timeout conectando al backend");
      return json(
        { error: "Timeout de conexión al servidor" }, 
        { status: 504 }
      );
    }
    
    console.error("[AUTH] Error en registro proxy:", error);
    return json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}

export function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
