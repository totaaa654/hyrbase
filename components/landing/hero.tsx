"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-14 text-center">
      {/* ── Animated gradient orbs ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -left-[15%] -top-[20%] size-[700px] rounded-full blur-[130px]"
          style={{
            background: "var(--orb-1)",
            animation: "orb-float-1 16s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-[15%] -right-[10%] size-[600px] rounded-full blur-[110px]"
          style={{
            background: "var(--orb-2)",
            animation: "orb-float-2 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[15%] top-[30%] size-[400px] rounded-full blur-[90px]"
          style={{
            background: "var(--orb-3)",
            animation: "orb-float-3 11s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Dot-grid texture ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.55 0.01 285 / 0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Content ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl space-y-8"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <Image
            src="/hyrbase_logo.png"
            alt="HyrBase"
            width={88}
            height={88}
            className="rounded-[22px] overflow-hidden"
            style={{
              boxShadow:
                "0 8px 40px oklch(0.627 0.265 293 / 0.45), 0 2px 12px oklch(0.627 0.265 293 / 0.25)",
            }}
            priority
          />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-primary"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.558 0.288 293 / 0.1), oklch(0.65 0.22 310 / 0.08))",
            border: "1px solid oklch(0.627 0.265 293 / 0.28)",
          }}
        >
          <Sparkles className="size-3" />
          AI-powered job application tracking
        </motion.div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-[5rem]">
          Your job search,
          <br />
          <span className="animated-gradient-text">finally organized.</span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto max-w-[520px] text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Track every application, analyze your resume with AI, and generate
          tailored cover letters — all from one intelligent dashboard.
        </p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Button
            size="lg"
            asChild
            className="h-11 gap-2 border-0 px-7 text-sm font-semibold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
              boxShadow: "0 4px 28px oklch(0.627 0.265 293 / 0.4)",
            }}
          >
            <Link href="/signup">
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="h-11 px-7 text-sm text-muted-foreground"
          >
            <Link href="/login">Sign in to your account</Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Bottom fade-out */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent, var(--color-background))",
        }}
      />
    </section>
  );
}
