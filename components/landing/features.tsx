"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Sparkles,
  FileText,
  BarChart2,
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react";

const FEATURES = [
  {
    icon: Briefcase,
    title: "Application Tracking",
    description:
      "Manage the full application lifecycle — wishlist to offer — in a clean, status-driven board.",
    gradient: "linear-gradient(135deg, oklch(0.627 0.265 293 / 0.18), oklch(0.72 0.20 310 / 0.12))",
    iconColor: "oklch(0.627 0.265 293)",
  },
  {
    icon: Sparkles,
    title: "AI Resume Analysis",
    description:
      "Get an instant compatibility score, surface skill gaps, and receive targeted ATS optimization tips.",
    gradient: "linear-gradient(135deg, oklch(0.62 0.26 300 / 0.18), oklch(0.75 0.18 315 / 0.12))",
    iconColor: "oklch(0.70 0.22 305)",
  },
  {
    icon: FileText,
    title: "Cover Letter Generator",
    description:
      "Generate personalized, job-specific cover letters from your resume and the job description in seconds.",
    gradient: "linear-gradient(135deg, oklch(0.65 0.24 290 / 0.18), oklch(0.70 0.22 278 / 0.12))",
    iconColor: "oklch(0.65 0.25 285)",
  },
  {
    icon: BarChart2,
    title: "Analytics Dashboard",
    description:
      "Visualize your job search funnel, track response rates, and understand what is actually working.",
    gradient: "linear-gradient(135deg, oklch(0.60 0.27 295 / 0.18), oklch(0.68 0.24 308 / 0.12))",
    iconColor: "oklch(0.62 0.27 295)",
  },
  {
    icon: FolderOpen,
    title: "Resume Manager",
    description:
      "Upload, version, and store multiple resumes for different roles. Reuse them with one click.",
    gradient: "linear-gradient(135deg, oklch(0.70 0.20 288 / 0.18), oklch(0.75 0.17 275 / 0.12))",
    iconColor: "oklch(0.68 0.22 283)",
  },
  {
    icon: SlidersHorizontal,
    title: "Smart Search & Filters",
    description:
      "Find any application instantly with real-time search and multi-dimensional filtering.",
    gradient: "linear-gradient(135deg, oklch(0.63 0.26 298 / 0.18), oklch(0.72 0.21 312 / 0.12))",
    iconColor: "oklch(0.66 0.24 303)",
  },
] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center space-y-3">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            Everything you need
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Built for the modern job search
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Every tool you need to stay organized, stand out, and land faster.
          </p>
        </div>

        {/* Feature grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-64px" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, description, gradient, iconColor }) => (
            <motion.div
              key={title}
              variants={item}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl"
              style={{
                ["--hover-shadow" as string]:
                  "0 16px 48px oklch(0.627 0.265 293 / 0.12)",
              }}
            >
              {/* Icon with gradient background */}
              <div
                className="mb-4 inline-flex size-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                style={{ background: gradient }}
              >
                <Icon className="size-5" style={{ color: iconColor }} />
              </div>
              <h3 className="mb-2 font-bold tracking-tight">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
