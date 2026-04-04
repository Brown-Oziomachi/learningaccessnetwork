"use client";

import React, { useEffect, useRef, useState } from "react";
import { Settings, LayoutGrid, GitBranch, Upload } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: Settings,
    title: "Set up your local environment",
    desc: 'Initialise the "ACME" Next.js project template and get your dev server running in minutes.',
  },
  {
    icon: LayoutGrid,
    title: "Use pre-styled components",
    desc: "Drop in battle-tested UI blocks for every chapter — built on Next.js conventions and patterns.",
  },
  {
    icon: GitBranch,
    title: "Hook up real application logic",
    desc: "Wire live data, auth flows, and API routes to bring a fully-fledged demo website to life.",
  },
  {
    icon: Upload,
    title: "Ship and deploy your own",
    desc: "By the end you'll have a production-ready website — and the skills to build the next one.",
  },
];

// ── Animated counter hook ─────────────────────────────────────────────────────
function useInView(ref) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

// ── Fake browser chrome with layered screenshots ──────────────────────────────
function AppMockup() {
  return (
    <div className="relative w-full max-w-[620px] mx-auto select-none">

      {/* ── Back window (Dashboard) ── */}
      <div
        className="absolute top-0 left-0 w-[78%] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: "#0f172a" }}
      >
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#1e293b] border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <div className="flex-1 mx-3 h-4 rounded bg-white/10 text-[9px] text-white/30 flex items-center px-2">
            acme.vercel.app
          </div>
        </div>
        {/* dashboard UI */}
        <div className="flex h-52">
          {/* sidebar */}
          <div className="w-28 bg-[#1e293b] border-r border-white/10 p-3 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-[7px] text-white font-black">A</span>
              </div>
              <span className="text-[9px] text-white font-bold">Acme</span>
            </div>
            {["Home", "Invoices", "Customers"].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[8px] font-medium ${i === 0 ? "bg-blue-600 text-white" : "text-white/50"}`}
              >
                <div className="w-2 h-2 rounded-sm bg-current opacity-70" />
                {item}
              </div>
            ))}
            <div className="mt-auto text-[8px] text-white/30 flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-current" /> Sign Out
            </div>
          </div>
          {/* main */}
          <div className="flex-1 p-3 overflow-hidden">
            <p className="text-[10px] font-bold text-white mb-2">Dashboard</p>
            <div className="flex gap-2 mb-3">
              {["Collected", "Pending"].map((label) => (
                <div key={label} className="flex-1 bg-white/5 rounded-lg p-2">
                  <p className="text-[7px] text-white/50">{label}</p>
                  <p className="text-[11px] font-black text-white">$2,689</p>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-white/50 mb-2">Recent Revenue</p>
            {/* bar chart */}
            <div className="flex items-end gap-1 h-14">
              {[30, 55, 40, 70, 45, 80, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{ height: `${h}%`, background: i === 5 ? "#3b82f6" : "#1e40af" }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
                <span key={m} className="text-[6px] text-white/30">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Front window (Invoices table) ── */}
      <div
        className="relative ml-[16%] mt-10 w-[84%] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: "#ffffff" }}
      >
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 border-b border-gray-200">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <div className="flex-1 mx-3 h-4 rounded bg-gray-200 text-[9px] text-gray-400 flex items-center px-2">
            acme.vercel.app/invoices
          </div>
        </div>
        {/* invoices UI */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-800">Invoices</p>
            <div className="bg-blue-600 text-white text-[7px] font-bold px-2 py-1 rounded-md">
              + Create Invoice
            </div>
          </div>
          {/* search bar */}
          <div className="h-6 rounded border border-gray-200 bg-gray-50 mb-2 px-2 flex items-center">
            <span className="text-[8px] text-gray-400">Search invoices…</span>
          </div>
          {/* table header */}
          <div className="grid grid-cols-5 gap-1 px-1 mb-1">
            {["#", "Customer", "Email", "Amount", "Status"].map((h) => (
              <span key={h} className="text-[7px] text-gray-400 font-semibold">{h}</span>
            ))}
          </div>
          {/* rows */}
          {[
            { status: "Pending", color: "bg-orange-100 text-orange-700", amount: "$157.85" },
            { status: "Paid", color: "bg-green-100 text-green-700", amount: "$125.00" },
            { status: "Pending", color: "bg-orange-100 text-orange-700", amount: "$340.00" },
            { status: "Paid", color: "bg-green-100 text-green-700", amount: "$89.50" },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-5 gap-1 px-1 py-1 border-t border-gray-100 items-center">
              <span className="text-[7px] text-gray-400 truncate">85842ba…</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-[7px] text-gray-600 truncate">Ada L.</span>
              </div>
              <span className="text-[7px] text-gray-400 truncate">ada@…</span>
              <span className="text-[7px] font-bold text-gray-800">{row.amount}</span>
              <span className={`text-[6px] font-bold px-1 py-0.5 rounded-full ${row.color}`}>{row.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Floating mobile card ── */}
      <div
        className="absolute bottom-[-20px] right-[-10px] lg:right-[-30px] w-28 sm:w-32 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
        style={{ background: "#0f172a" }}
      >
        {/* tiny status bar */}
        <div className="h-3 bg-[#1e293b] flex items-center justify-end px-2 gap-1">
          <div className="w-4 h-1 rounded bg-white/20" />
          <div className="w-1 h-1 rounded-full bg-white/30" />
        </div>
        {/* mobile sidebar */}
        <div className="p-2">
          <div className="flex items-center gap-1 mb-2">
            <div className="w-5 h-5 rounded bg-blue-600" />
            <span className="text-[8px] text-white font-bold">Acme</span>
          </div>
          <div className="flex justify-around mb-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-4 h-4 rounded ${i === 0 ? "bg-blue-600" : "bg-white/10"}`} />
            ))}
          </div>
          <p className="text-[7px] text-white/60 mb-1">Dashboard</p>
          <div className="bg-white/5 rounded p-1 mb-1">
            <p className="text-[6px] text-white/40">Collected</p>
            <p className="text-[9px] text-white font-black">$2,689</p>
          </div>
          <div className="bg-white/5 rounded p-1">
            <p className="text-[6px] text-white/40">Pending</p>
            <p className="text-[9px] text-white font-black">$3,468</p>
          </div>
          <p className="text-[6px] text-white/40 mt-1.5 text-center">Invoices →</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const visible = useInView(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 lg:py-28 bg-[#030712] overflow-hidden"
    >
      {/* ── Subtle grid background ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* top fade */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#030712] to-transparent pointer-events-none" />
      {/* bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />
      {/* blue glow blob */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">

        {/* ── Heading ── */}
        <div
          className={`text-center mb-14 lg:mb-20 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <p className="text-blue-400 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-3">
            The Method
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            How does the course{" "}
            <span className="text-blue-400">work?</span>
          </h2>
          <p className="mt-4 text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            By building a full web application.{" "}
            <span className="text-white font-semibold">Step by step.</span>
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-14 lg:gap-20">

          {/* ── LEFT: App Mockup ── */}
          <div
            className={`w-full lg:w-1/2 transition-all duration-700 delay-150 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
          >
            <AppMockup />
          </div>

          {/* ── RIGHT: Steps ── */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className={`flex gap-4 items-start transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  {/* icon bubble */}
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center shadow-lg shadow-blue-950/40">
                    <Icon size={18} className="text-blue-400" strokeWidth={1.8} />
                  </div>
                  {/* text */}
                  <div>
                    <p className="text-white font-bold text-sm sm:text-base leading-snug mb-1">
                      {step.title}
                    </p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* CTA */}
            <div
              className={`mt-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: "700ms" }}
            >
              <a
                href="/auth/signin"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-full transition-all shadow-lg shadow-blue-900/40 text-sm sm:text-base"
              >
                Start learning for free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}