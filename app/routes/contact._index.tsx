import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, Form } from "@remix-run/react";
import { useState, useEffect } from "react";
import { ogImage } from "../content/links";
import { pool } from "../lib/db";
import ContactForm from "../components/ContactForm";

export const meta: MetaFunction = () => ([
  { title: "Contact | Éclectique by KMC" },
  { name: "description", content: "Have questions or collaboration ideas? Write to us here or through social media." },
  { property: "og:title", content: "Contact — Éclectique by KMC" },
  { property: "og:image", content: ogImage },
]);

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const message = formData.get("message")?.toString();

  if (!name || !email || !message) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  if (name.trim().length < 2) {
    return json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }

  if (!/@/.test(email)) {
    return json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  if (message.trim().length < 5) {
    return json({ error: "Message must be at least 5 characters" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO contact_submissions (name, email, message, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [name.trim(), email.trim(), message.trim()]
    );
    
    return json({ success: "Thank you! Your message has been sent successfully." });
  } catch (error) {
    console.error('Error saving contact submission:', error);
    return json({ error: "There was an error sending your message. Please try again." }, { status: 500 });
  } finally {
    client.release();
  }
};

export default function Contact() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('adminAuth') === 'true');
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contact</h1>
          <p className="mt-2 text-gray-600">Leave us a message or reach out via Instagram/TikTok.</p>
        </div>
        {isAdmin && (
          <a
            href="/admin/contact"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Manage Contact Submissions
          </a>
        )}
      </div>
      <div className="mt-6">
        <ContactForm />
      </div>
    </main>
  );
}