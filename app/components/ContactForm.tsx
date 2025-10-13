import React, { useState } from "react";
import { content } from "../content/links";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const mailto = `mailto:contact@eclectiquebykmc.com?subject=Contacto%20Eclectique%20by%20KMC&body=Nombre:%20${encodeURIComponent(
    name
  )}%0AEmail:%20${encodeURIComponent(email)}%0A%0A${encodeURIComponent(message)}`;

  const valid = name.trim().length > 1 && /@/.test(email) && message.trim().length > 5;

  return (
    <form className="grid max-w-xl gap-4" action={mailto} method="post">
      <input
        type="text"
        placeholder="Nombre"
        className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        aria-label="Nombre"
      />
      <input
        type="email"
        placeholder="Email"
        className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Email"
      />
      <textarea
        placeholder="Mensaje"
        className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        aria-label="Mensaje"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!valid}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-light disabled:opacity-50"
        >
          Enviar
        </button>
        <a
          href={content.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:underline"
        >
          Escribir por Instagram
        </a>
        <a href={content.social.tiktok} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
          TikTok
        </a>
        <a href={content.social.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
          Facebook
        </a>
      </div>
    </form>
  );
}
