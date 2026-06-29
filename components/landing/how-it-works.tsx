"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Add your applications",
    description:
      "Paste a job listing or enter details manually. HyrBase keeps every company, role, and status in one place.",
  },
  {
    number: "02",
    title: "Analyze your fit with AI",
    description:
      "Upload your resume and let AI score your compatibility, highlight skill gaps, and surface quick wins.",
  },
  {
    number: "03",
    title: "Track all the way to offer",
    description:
      "Follow every stage from applied to offer. Know exactly where you stand and what to prepare next.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="relative px-4 py-28 overflow-hidden">
      {/* Subtle background tint */}
      <div className="absolute inset-0 -z-10 bg-muted/30" />

      {/* Orb accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "var(--orb-1)", opacity: 0.5 }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-20 text-center space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            Simple by design
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            How it works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map(({ number, title, description }, i) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: "easeOut" }}
              className="relative flex flex-col gap-4"
            >
              {/* Gradient step number */}
              <div className="mb-2 opacity-50">
                <span
                  className="bg-clip-text text-transparent font-black text-6xl leading-none tabular-nums"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, oklch(0.627 0.265 293), oklch(0.72 0.20 310))",
                  }}
                >
                  {number}
                </span>
              </div>

              {/* Connector line (desktop, not last) */}
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-full top-8 hidden h-px w-8 md:block"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, oklch(0.627 0.265 293 / 0.35), transparent)",
                  }}
                />
              )}

              <div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
