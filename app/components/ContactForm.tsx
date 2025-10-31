import React, { useState, useEffect } from "react";
import { Form, useActionData } from "@remix-run/react";
import { content } from "../content/links";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const actionData = useActionData<{ success?: string; error?: string }>();

  const valid = name.trim().length > 1 && /@/.test(email) && message.trim().length > 5;

  // Clear form after successful submission
  useEffect(() => {
    if (actionData?.success) {
      setName("");
      setEmail("");
      setMessage("");
    }
  }, [actionData?.success]);

  return (
    <div className="max-w-xl">
      {actionData?.success && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-green-800">{actionData.success}</p>
        </div>
      )}
      
      {actionData?.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-800">{actionData.error}</p>
        </div>
      )}

      <Form method="post" className="grid gap-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-label="Name"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email"
        />
        <textarea
          name="message"
          placeholder="Message"
          className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          aria-label="Message"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!valid}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-light disabled:opacity-50"
          >
            Send
          </button>
          <a
            href={content.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Message on Instagram
          </a>
          <a href={content.social.tiktok} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
            TikTok
          </a>
          <a href={content.social.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
            Facebook
          </a>
        </div>
      </Form>
    </div>
  );
}
