import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";

const UTILITY_LOGOS = ["PG&E", "SCE", "SDG&E", "LADWP", "SMUD", "MCE"];

export default function Home() {
  const [message, setMessage] = useState("");
  const [, navigate] = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = message.trim();
    if (!q) return;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }

  return (
    <>
      <Helmet>
        <title>Enlighting Energy — Find Your California Energy Incentives</title>
        <meta name="description" content="Discover every utility rebate, state grant, and federal incentive your California commercial facility qualifies for. AI-powered matching, instant PDF report." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#1C2B5E]">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
          <div className="flex items-center">
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMjAgOTAiIHdpZHRoPSIzMjAiIGhlaWdodD0iOTAiPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ1LDQ1KSI+CiAgICA8bGluZSB4MT0iMCIgeTE9Ii00MCIgeDI9IjAiIHkyPSItMTgiIHN0cm9rZT0iIzhCMkZDOSIgc3Ryb2tlLXdpZHRoPSI1LjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPGxpbmUgeDE9IjQwIiB5MT0iMCIgeDI9IjE4IiB5Mj0iMCIgc3Ryb2tlPSIjOEIyRkM5IiBzdHJva2Utd2lkdGg9IjUuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8bGluZSB4MT0iMCIgeTE9IjQwIiB4Mj0iMCIgeTI9IjE4IiBzdHJva2U9IiM4QjJGQzkiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxsaW5lIHgxPSItNDAiIHkxPSIwIiB4Mj0iLTE4IiB5Mj0iMCIgc3Ryb2tlPSIjOEIyRkM5IiBzdHJva2Utd2lkdGg9IjUuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8bGluZSB4MT0iMjguMyIgeTE9Ii0yOC4zIiB4Mj0iMTIuNyIgeTI9Ii0xMi43IiBzdHJva2U9IiM4QjJGQzkiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxsaW5lIHgxPSIyOC4zIiB5MT0iMjguMyIgeDI9IjEyLjciIHkyPSIxMi43IiBzdHJva2U9IiM4QjJGQzkiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxsaW5lIHgxPSItMjguMyIgeTE9IjI4LjMiIHgyPSItMTIuNyIgeTI9IjEyLjciIHN0cm9rZT0iIzhCMkZDOSIgc3Ryb2tlLXdpZHRoPSI1LjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPGxpbmUgeDE9Ii0yOC4zIiB5MT0iLTI4LjMiIHgyPSItMTIuNyIgeTI9Ii0xMi43IiBzdHJva2U9IiM4QjJGQzkiIHN0cm9rZS13aWR0aD0iNS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxsaW5lIHgxPSIxNS4zIiB5MT0iLTM2LjkiIHgyPSI3IiB5Mj0iLTE2LjkiIHN0cm9rZT0iIzhCMkZDOSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxsaW5lIHgxPSIzNi45IiB5MT0iLTE1LjMiIHgyPSIxNi45IiB5Mj0iLTciIHN0cm9rZT0iIzhCMkZDOSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxsaW5lIHgxPSIzNi45IiB5MT0iMTUuMyIgeDI9IjE2LjkiIHkyPSI3IiBzdHJva2U9IiM4QjJGQzkiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8bGluZSB4MT0iMTUuMyIgeTE9IjM2LjkiIHgyPSI3IiB5Mj0iMTYuOSIgc3Ryb2tlPSIjOEIyRkM5IiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPGxpbmUgeDE9Ii0xNS4zIiB5MT0iMzYuOSIgeDI9Ii03IiB5Mj0iMTYuOSIgc3Ryb2tlPSIjOEIyRkM5IiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPGxpbmUgeDE9Ii0zNi45IiB5MT0iMTUuMyIgeDI9Ii0xNi45IiB5Mj0iNyIgc3Ryb2tlPSIjOEIyRkM5IiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPGxpbmUgeDE9Ii0zNi45IiB5MT0iLTE1LjMiIHgyPSItMTYuOSIgeTI9Ii03IiBzdHJva2U9IiM4QjJGQzkiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgICA8bGluZSB4MT0iLTE1LjMiIHkxPSItMzYuOSIgeDI9Ii03IiB5Mj0iLTE2LjkiIHN0cm9rZT0iIzhCMkZDOSIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSI1LjUiIGZpbGw9IiM4QjJGQzkiLz4KICA8L2c+CiAgPHRleHQgeD0iOTciIHk9IjYyIgogICAgZm9udC1mYW1pbHk9IidBcmlhbCBCbGFjaycsICdIZWx2ZXRpY2EgTmV1ZScsIEFyaWFsLCBzYW5zLXNlcmlmIgogICAgZm9udC13ZWlnaHQ9IjkwMCIKICAgIGZvbnQtc2l6ZT0iNDgiCiAgICBmaWxsPSJ3aGl0ZSIKICAgIGxldHRlci1zcGFjaW5nPSItMC41Ij5lbmxpZ2h0aW5nPC90ZXh0Pgo8L3N2Zz49"
              alt="Enlighting Energy"
              className="h-[60px] w-auto"
            />
          </div>
          <div className="flex items-center gap-6">
            <a href="https://enlightingenergy.com" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white text-sm transition-colors">About Us</a>
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#C84EC4] animate-pulse" />
            <span className="text-white text-xs font-semibold uppercase tracking-widest">AI-Powered Incentive Matching</span>
          </div>

          <h1 className="text-white font-black text-4xl sm:text-5xl lg:text-6xl leading-tight max-w-3xl mb-4">
            Find every incentive your facility qualifies for.
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-10 leading-relaxed">
            Describe your facility and what you're upgrading. Our AI matches you to every utility rebate, state grant, and federal program — then generates a full PDF report in under 90 seconds.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => { setMessage(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Tell me about your facility — what it is, where it's located, and what you're looking to upgrade…"
                className="w-full px-6 pt-5 pb-2 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-base leading-relaxed"
              />
              <div className="flex items-center justify-between px-6 pb-4 pt-2">
                <span className="text-xs text-gray-400">Press Enter to start ↵</span>
                <button type="submit" disabled={!message.trim()}
                  className="bg-[#C84EC4] hover:bg-[#a83ea5] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
                  Find My Programs
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["Warehouse in Fresno, want LED + HVAC", "Office building in Riverside, 30k sqft", "Cold storage facility in Stockton"].map((ex) => (
                <button key={ex} type="button" onClick={() => { setMessage(ex); textareaRef.current?.focus(); }}
                  className="text-xs text-blue-200 border border-blue-200/30 hover:border-blue-200/60 hover:text-white rounded-full px-3 py-1 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </form>

          <p className="text-blue-300/70 text-sm mt-8">
            Used by facility managers at <span className="text-blue-200 font-medium">Boeing</span>, <span className="text-blue-200 font-medium">DreamWorks</span>, <span className="text-blue-200 font-medium">NASA JPL</span>, and 200+ California businesses
          </p>
        </main>

        {/* How it works */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-[#C84EC4] mb-3">How it works</p>
            <h2 className="text-center text-3xl font-black text-[#1C2B5E] mb-12">From conversation to report in 90 seconds</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Tell us about your facility", desc: "Describe your building and upgrades in plain English. Our AI understands context — no forms, no dropdowns." },
                { step: "02", title: "We match your programs", desc: "We scan utility rebates, state grants, and federal incentives across SCE, PG&E, SDG&E, LADWP, SMUD, and more." },
                { step: "03", title: "Receive your report", desc: "Get a full PDF with program details, stacking notes, deadlines, and pre-approval requirements — specific to your facility." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1C2B5E] text-white font-black text-sm flex items-center justify-center mx-auto mb-4">{step}</div>
                  <h3 className="font-bold text-[#1C2B5E] text-lg mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button onClick={() => navigate("/chat")}
                className="bg-[#1C2B5E] hover:bg-[#2a3d7e] text-white font-bold px-8 py-4 rounded-xl text-base transition-colors">
                Get My Free Report →
              </button>
            </div>
          </div>
        </section>

        {/* Utility logos */}
        <section className="bg-gray-50 py-10 px-6 border-t border-gray-200">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Programs from</p>
          <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto">
            {UTILITY_LOGOS.map((u) => (
              <span key={u} className="text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">{u}</span>
            ))}
            <span className="text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">IRA / 179D</span>
            <span className="text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">CPUC / CEC</span>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#1C2B5E] py-8 px-6 text-center text-blue-200/60 text-sm">
          <p className="font-medium text-blue-200 mb-1">Enlighting Energy</p>
          <p>
            <a href="mailto:hello@enlightingenergy.com" className="hover:text-white transition-colors">hello@enlightingenergy.com</a>
            {" · "}805-724-5299{" · "}Santa Barbara, CA
          </p>
          <p className="mt-3 text-xs">
            <a href="/terminology" className="hover:text-white transition-colors">Terminology</a>
          </p>
        </footer>
      </div>
    </>
  );
}
