import React from "react";

type CTA = { label: string; href: string };

export default function Hero({
  title,
  subtitle,
  subtitle2,
  primary,
  secondary,
  children,
}: {
  title: string;
  subtitle: string;
  subtitle2?: string;
  primary: CTA;
  secondary?: CTA;
  children?: React.ReactNode;
}) {
  // Si el título contiene " by ", dividir para dar jerarquía visual
  const parts = title.split(/\s+by\s+/i);
  return (
    <section className="bg-primary text-white">
      <div className="mx-auto max-w-5xl px-6 py-14 md:py-28">
        <h1 className="font-extrabold tracking-tight leading-tight">
          {parts.length === 2 ? (
            <>
              <span className="block text-6xl sm:text-8xl md:text-9xl">{parts[0]}</span>
              <span className="block text-3xl sm:text-4xl md:text-5xl opacity-90 text-accent">by KMC</span>
            </>
          ) : (
            <span className="text-3xl sm:text-4xl md:text-6xl">{title}</span>
          )}
        </h1>
        <p className="mt-4 md:mt-6 text-base md:text-lg text-gray-200 max-w-2xl">{subtitle}</p>
        {subtitle2 ? (
          <p className="mt-2 md:mt-3 text-sm md:text-base text-gray-300 max-w-2xl">{subtitle2}</p>
        ) : null}
        <div className="mt-6 md:mt-10 flex gap-3 md:gap-4 flex-wrap items-center">
          <a
            href={primary.href}
            className="inline-flex items-center rounded-md bg-accent px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base font-semibold text-black hover:opacity-90"
          >
            {primary.label}
          </a>
          {children}
        </div>
      </div>
    </section>
  );
}
