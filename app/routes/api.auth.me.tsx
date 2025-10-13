import { json, type LoaderFunctionArgs } from "@remix-run/node";

// Manejar PATCH (actualizar perfil) y DELETE (eliminar cuenta)
export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    if (method !== "PATCH" && method !== "DELETE") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    const authHeader = request.headers.get("Authorization");
    const cookieHeader = request.headers.get("Cookie");

    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const headers: Record<string, string> = {};
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const init: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (method === 'PATCH') {
      const body = await request.json();
      (init.headers as Record<string, string>)["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const response = await fetch(`${backendUrl}/api/auth/me`, init);

    clearTimeout(timeoutId);

    // Passthrough de headers (incluye Set-Cookie si aplica)
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return json({ error: 'Timeout de conexión al servidor' }, { status: 504 });
    }
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');

    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Passthrough de headers y body
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return json({ error: 'Timeout de conexión al servidor' }, { status: 504 });
    }
    return json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
