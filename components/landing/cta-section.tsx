"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative overflow-hidden px-4 py-32">
      {/* Animated orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -bottom-1/4 left-1/4 size-[600px] rounded-full blur-[120px]"
          style={{
            background: "var(--orb-1)",
            animation: "orb-float-2 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -top-1/4 right-1/4 size-[450px] rounded-full blur-[100px]"
          style={{
            background: "var(--orb-3)",
            animation: "orb-float-3 14s ease-in-out infinite",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-2xl text-center space-y-6"
      >
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Start your job search{" "}
          <span className="animated-gradient-text">smarter.</span>
        </h2>
        <p className="text-lg text-muted-foreground">
          Join job seekers who use HyrBase to stay organized, stand out, and
          land faster. Free to get started — no credit card required.
        </p>

        <Button
          size="lg"
          asChild
          className="h-11 gap-2 border-0 px-8 text-sm font-semibold shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.558 0.288 293), oklch(0.65 0.22 310))",
            boxShadow: "0 4px 28px oklch(0.627 0.265 293 / 0.4)",
          }}
        >
          <Link href="/signup">
            Create your free account
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}
