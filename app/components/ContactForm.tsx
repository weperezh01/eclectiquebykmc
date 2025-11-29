import React, { useState, useEffect } from "react";
import { Form, useActionData } from "@remix-run/react";
import { content } from "../content/links";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [mathAnswer, setMathAnswer] = useState("");
  const [formStartTime] = useState(Date.now());
  const actionData = useActionData<{ success?: string; error?: string }>();

  // Generate simple math challenge
  const [mathChallenge] = useState(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operator = Math.random() > 0.5 ? '+' : '-';
    const question = operator === '+' ? `${num1} + ${num2}` : `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
    const answer = operator === '+' ? num1 + num2 : Math.max(num1, num2) - Math.min(num1, num2);
    return { question, answer };
  });

  const valid = name.trim().length > 1 && /@/.test(email) && message.trim().length > 5 && mathAnswer === String(mathChallenge.answer);

  // Clear form after successful submission
  useEffect(() => {
    if (actionData?.success) {
      setName("");
      setEmail("");
      setMessage("");
      setMathAnswer("");
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
        {/* Honeypot field - hidden from users but visible to bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            visibility: 'hidden',
            opacity: 0,
            height: 0,
            width: 0
          }}
          aria-hidden="true"
        />
        
        {/* Hidden timestamp field for timing validation */}
        <input
          type="hidden"
          name="formStartTime"
          value={formStartTime}
        />
        
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
        
        {/* Math captcha */}
        <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
          <label htmlFor="mathCaptcha" className="block text-sm font-medium text-gray-700 mb-2">
            Are you a robot? Please solve: {mathChallenge.question} = ?
          </label>
          <input
            id="mathCaptcha"
            type="number"
            name="mathAnswer"
            placeholder="Enter your answer"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            value={mathAnswer}
            onChange={(e) => setMathAnswer(e.target.value)}
            required
            aria-label={`Math question: ${mathChallenge.question}`}
          />
          <input
            type="hidden"
            name="mathQuestion"
            value={mathChallenge.question}
          />
          <input
            type="hidden"
            name="expectedAnswer"
            value={mathChallenge.answer}
          />
        </div>
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
