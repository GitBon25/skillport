import React from "react";
import { cn } from "@/utils/cn";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[28px] border border-white/65 bg-[rgba(255,252,247,0.82)] p-4 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl",
        props.className
      )}
    />
  );
}

export function Button({
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-300/70 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<string, string> = {
    primary:
      "border-transparent bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-500 text-white shadow-[0_18px_40px_-20px_rgba(13,148,136,0.75)] hover:-translate-y-0.5 hover:brightness-105",
    secondary:
      "border-white/70 bg-white/80 text-slate-800 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.35)] hover:-translate-y-0.5 hover:bg-white",
    ghost:
      "border-transparent bg-transparent text-slate-700 hover:border-white/50 hover:bg-white/55 hover:text-slate-950",
    danger:
      "border-transparent bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-[0_18px_40px_-24px_rgba(244,63,94,0.65)] hover:-translate-y-0.5 hover:brightness-105",
  };
  const sizes: Record<string, string> = {
    sm: "h-10 px-4",
    md: "h-11 px-5",
  };
  return <button {...props} className={cn(base, variants[variant], sizes[size], props.className)} />;
}

export function Badge({
  tone = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "slate" | "indigo" | "emerald" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    slate: "border border-slate-200/80 bg-white/70 text-slate-700",
    indigo: "border border-cyan-200/70 bg-cyan-50/80 text-cyan-800",
    emerald: "border border-emerald-200/70 bg-emerald-50/85 text-emerald-800",
    amber: "border border-amber-200/80 bg-amber-50/90 text-amber-900",
    rose: "border border-rose-200/80 bg-rose-50/85 text-rose-700",
  };
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        props.className
      )}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-white/75 bg-white/80 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/80",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-white/75 bg-white/80 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/80",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/75 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-100/80",
        props.className
      )}
    />
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-slate-300/80 to-transparent", className)} />;
}
