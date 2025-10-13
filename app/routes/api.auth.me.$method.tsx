import { json, type ActionFunctionArgs } from "@remix-run/node";

export async function action({ request, params }: ActionFunctionArgs) {
  const method = params.method;

  try {
    const authHeader = request.headers.get("Authorization");
    const cookieHeader = request.headers.get("Cookie");

    // Determinar la URL del backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';

    let backendEndpoint = '';
    let requestMethod = request.method;
    let body: any = null;

    // Configurar endpoint según el método
    if (method === 'password') {
      backendEndpoint = '/api/auth/me/password';
      body = await request.json();
    } else if (method === 'avatar') {
      backendEndpoint = '/api/auth/me/avatar';
      if (request.method === 'POST') {
        // Para subir archivo, pasar el FormData directamente
        body = await request.formData();
      }
    } else {
      return json({ error: "Método no válido" }, { status: 404 });
    }
    
    console.log(`[AUTH] ${requestMethod} ${backendEndpoint}`);
    
    // Hacer la llamada al backend con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos para uploads
    
    const requestInit: RequestInit = {
      method: requestMethod,
      headers: {},
      signal: controller.signal,
    };

    const hdrs = requestInit.headers as Record<string, string>;
    if (authHeader) hdrs["Authorization"] = authHeader;
    if (cookieHeader) hdrs["Cookie"] = cookieHeader;

    // Si es FormData (para upload de avatar), no añadir Content-Type
    if (body instanceof FormData) {
      requestInit.body = body;
    } else if (body) {
      (requestInit.headers as any)["Content-Type"] = "application/json";
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(`${backendUrl}${backendEndpoint}`, requestInit);
    
    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`[AUTH] Error parseando respuesta del backend:`, jsonError);
      return json(
        { error: "Error procesando respuesta del servidor" }, 
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      console.log(`[AUTH] Error del backend (${response.status}):`, data);
      return json(
        { 
          error: data.message || data.error || "Error en la operación",
          detail: data.detail || undefined
        }, 
        { status: response.status }
      );
    }

    console.log(`[AUTH] Operación exitosa: ${requestMethod} ${backendEndpoint}`);

    // Retornar respuesta del backend
    return json(data);

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("[AUTH] Timeout conectando al backend");
      return json(
        { error: "Timeout de conexión al servidor" }, 
        { status: 504 }
      );
    }
    
    console.error("[AUTH] Error en proxy:", error);
    return json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}

// También maneja PATCH para actualizar perfil
export async function loader({ request, params }: { request: Request; params: any }) {
  if (request.method === 'PATCH') {
    return action({ request, params });
  }
  return json({ error: "Method not allowed" }, { status: 405 });
}
