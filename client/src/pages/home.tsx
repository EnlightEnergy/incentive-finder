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
              src="/Enlighting_Logo_Wh.png"
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
                  className="text-xs text-white border border-white/30 hover:border-white/60 hover:text-white rounded-full px-3 py-1 transition-colors">
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
        <footer className="bg-[#1C2B5E] py-8 px-6 text-center text-white text-base">
          <p className="font-medium text-white mb-1">Enlighting Energy</p>
          <p>
            <a href="mailto:hello@enlightingenergy.com" className="hover:text-blue-200 transition-colors">hello@enlightingenergy.com</a>
            {" · "}805-724-5299{" · "}Santa Barbara, CA
          </p>
          <p className="mt-3 text-sm">
            <a href="/terminology" className="hover:text-blue-200 transition-colors">Terminology</a>
          </p>
        </footer>
      </div>
    </>
  );
}
