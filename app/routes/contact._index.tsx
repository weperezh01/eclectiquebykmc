import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, Form } from "@remix-run/react";
import { ogImage } from "../content/links";
import { pool } from "../lib/db";
import ContactForm from "../components/ContactForm";

export const meta: MetaFunction = () => ([
  { title: "Contact | Éclectique by KMC" },
  { name: "description", content: "Have questions or collaboration ideas? Write to us here or through social media." },
  { property: "og:title", content: "Contact — Éclectique by KMC" },
  { property: "og:image", content: ogImage },
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is authenticated and is admin
  let isAdmin = false;
  try {
    const authHeader = request.headers.get('Authorization');
    const cookieHeader = request.headers.get('Cookie');

    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'http://eclectique-backend:8020'
      : 'http://localhost:8020';

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(`${backendUrl}/api/auth/me`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const userData = await response.json();
      isAdmin = userData?.is_admin === true;
    }
  } catch (error) {
    // If auth fails, isAdmin remains false
    console.log('Auth check failed:', error);
  }
  
  return json({ isAdmin });
};

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
  const { isAdmin } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ success?: string; error?: string }>();

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Let's Connect
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Get in
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-400 to-accent">
                  Touch
                </span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl text-gray-300 leading-relaxed">
                Have collaboration ideas, style questions, or just want to say hello? 
                I'd love to hear from you.
              </p>
            </div>
            
            {/* Admin Button */}
            {isAdmin && (
              <div className="hidden md:block">
                <a
                  href="/admin/contact"
                  className="inline-flex items-center gap-3 rounded-xl bg-accent/10 backdrop-blur-sm border border-accent/20 px-6 py-3 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Manage Submissions
                </a>
              </div>
            )}
          </div>
          
          {/* Mobile Admin Button */}
          {isAdmin && (
            <div className="mt-6 md:hidden">
              <a
                href="/admin/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-accent/10 backdrop-blur-sm border border-accent/20 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition-all duration-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Manage
              </a>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-gray-200/60 bg-white p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send me a message
              </h2>
              <ContactForm />
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Let's Connect
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Whether you have questions about a specific look, collaboration ideas, 
                or simply want to share your experience with our recommendations, 
                I'm here to listen.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600 text-sm">
                    Use the form here to send me your message directly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 11.914c2.21 0 4.009-1.8 4.009-4.01 0-2.21-1.8-4.009-4.009-4.009s-4.009 1.799-4.009 4.009c0 2.21 1.799 4.01 4.009 4.01zm.001-6.618c1.426 0 2.61 1.183 2.61 2.608 0 1.425-1.184 2.609-2.61 2.609s-2.609-1.184-2.609-2.609c0-1.425 1.183-2.608 2.609-2.608z"/>
                    <path d="M16.484 22.629c1.174 0 1.855-.832 1.855-2.148v-8.284c0-1.315-.681-2.148-1.855-2.148H7.516c-1.174 0-1.855.833-1.855 2.148v8.284c0 1.316.681 2.148 1.855 2.148z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Instagram</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Follow me for daily content and quick DM responses.
                  </p>
                  <a 
                    href="https://www.instagram.com/eclectiquebykmc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
                  >
                    @eclectiquebykmc
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                  <svg className="h-6 w-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.321 5.562a.75.75 0 00-.442-.442A17.692 17.692 0 0012 4.5c-2.295 0-4.613.44-6.879 1.12a.75.75 0 00-.442.442C3.905 7.034 3.5 9.264 3.5 12s.405 4.966 1.179 6.438a.75.75 0 00.442.442A17.692 17.692 0 0012 19.5c2.295 0 4.613-.44 6.879-1.12a.75.75 0 00.442-.442C20.095 16.966 20.5 14.736 20.5 12s-.405-4.966-1.179-6.438zM15.5 12l-3.5 2.25v-4.5L15.5 12z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">TikTok</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Find quick styling videos and trend alerts.
                  </p>
                  <a 
                    href="https://www.tiktok.com/@eclectiquebykmc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    @eclectiquebykmc
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                {[
                  {
                    question: "Do you respond to all collaborations?",
                    answer: "Yes! I read every message and respond personally. Collaborations that align with my style and values always receive priority."
                  },
                  {
                    question: "How long do you take to respond?",
                    answer: "I generally respond within 24-48 hours. Weekends may take a bit longer."
                  },
                  {
                    question: "Do you offer personal style consultations?",
                    answer: "I love helping! Send me your query and let's see how I can help you find your unique style."
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-l-4 border-accent pl-4">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {faq.question}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}