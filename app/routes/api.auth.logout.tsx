import { type ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
  }

  const backendUrl = process.env.NODE_ENV === 'production'
    ? 'http://eclectique-backend:8020'
    : 'http://localhost:8020';

  const cookieHeader = request.headers.get('Cookie') || '';

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    // Pasar respuesta y cabeceras (incluye Set-Cookie de invalidación)
    return new Response(res.body, { status: res.status, headers: res.headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'content-type': 'application/json' } });
  } finally {
    clearTimeout(t);
  }
}

export function loader() {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
}

