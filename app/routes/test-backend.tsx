import { json } from "@remix-run/node";

export async function loader() {
  try {
    // Determinar la URL del backend
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';
    
    // Hacer la llamada al backend
    const response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    
    return json({
      success: true,
      backend_status: data,
      backend_url: backendUrl,
      node_env: process.env.NODE_ENV
    });

  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      backend_url: process.env.NODE_ENV === 'production' 
        ? 'http://eclectique-backend:8020'
        : 'http://localhost:8020',
      node_env: process.env.NODE_ENV
    }, { status: 500 });
  }
}