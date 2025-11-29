import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { pool } from "../lib/db";

export async function loader({}: LoaderFunctionArgs) {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT NOW() as current_time');
      console.log('Database connection successful:', result.rows[0]);
      
      return json({
        success: true,
        message: "Database connection working",
        timestamp: result.rows[0].current_time
      });
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}