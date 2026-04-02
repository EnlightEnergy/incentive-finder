import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type ChatPhase = "conversation" | "email_gate" | "generating" | "complete";

interface MatchResult {
  facility: Record<string, string>;
  programs: Array<{
    measure: string;
    entries: Array<{
      name: string;
      category: string;
      administrator: string;
      incentiveStructure: string;
      deadline: string;
      preApprovalRequired?: boolean;
      nextStep?: string;
    }>;
  }>;
  programCount: number;
  summary: string;
}

interface ChatApiResponse {
  message: string;
  phase: ChatPhase;
  programCount?: number;
  programCountTeaser?: string;
  matchResult?: MatchResult;
}

export default function Chat() {
  const [location] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<ChatPhase>("conversation");
  const [programCount, setProgramCount] = useState<number | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      const userMsg: Message = { role: "user", content: q };
      setMessages([userMsg]);
      sendToAPI([userMsg]);
    } else {
      setMessages([{ role: "assistant", content: "Hi! I'm here to find every incentive program your facility qualifies for.\n\nTell me about your building — where it's located, what type of facility it is, and what upgrades you're considering. You can just describe it naturally." }]);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, phase]);
  useEffect(() => { if (!loading && phase === "conversation") inputRef.current?.focus(); }, [loading, phase]);

  async function sendToAPI(history: Message[]) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
      if (!res.ok) throw new Error(await res.text());
      const data: ChatApiResponse = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      setPhase(data.phase);
      if (data.programCount !== undefined) setProgramCount(data.programCount);
      if (data.matchResult) setMatchResult(data.matchResult);
    } catch (e: any) { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const updated = [...messages, { role: "user" as const, content: text }];
    setMessages(updated); setInput(""); sendToAPI(updated);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setPhase("generating"); setLoading(true); setError("");
    const nameStr = name.trim();
    const userContent = nameStr ? `My name is ${nameStr} and my email is ${email}` : `My email is ${email}`;
    const updated = [...messages, { role: "user" as const, content: userContent }];
    setMessages(updated);
    try {
      const res = await fetch("/api/submit-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updated, email, name: nameStr }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMatchResult(data.matchResult);
      setMessages((prev) => [...prev, { role: "assistant", content: `Got it${nameStr ? `, ${nameStr}` : ""}! I've sent your report to ${email}. You can also download it directly below.` }]);
      setPhase("complete");
    } catch (e: any) { setError("Something went wrong. Please try again."); setPhase("email_gate"); }
    finally { setLoading(false); }
  }

  async function downloadPDF() {
    if (!matchResult) return;
    setPdfBusy(true); setError("");
    try {
      const res = await fetch("/api/generate-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(matchResult) });
      if (!res.ok) throw new Error(await res.text());
      const blob = new Blob([await res.arrayBuffer()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const facilityName = matchResult?.facility?.name || "Facility";
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      const safeFilename = `${facilityName} - Incentive Programs Report | Enlighting (${today}).pdf`.replace(/[/\\?%*:|"<>]/g, "-");
      const a = document.createElement("a"); a.href = url; a.download = safeFilename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e: any) { setError("PDF generation failed. Please try again."); }
    setPdfBusy(false);
  }

  const stepCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-[#1C2B5E] text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-md">
        <a href="/" className="flex items-center gap-2 mr-auto">
          <img src="/Enlighting_Logo_White_Web_1763150856949.png" alt="Enlighting Energy" className="h-10 w-auto max-w-[140px] object-contain flex-shrink-0" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-xs text-blue-200 mt-0.5">California Energy Incentives</span>
          </div>
        </a>
        {phase === "conversation" && stepCount > 0 && (
          <div className="text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-full">
            {stepCount < 3 ? "Getting started…" : stepCount < 5 ? "Almost there…" : "Finalizing…"}
          </div>
        )}
        <a href="https://enlightingenergy.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-200 hover:text-white border border-blue-200/30 hover:border-blue-200/60 rounded-full px-3 py-1 transition-colors whitespace-nowrap">About Enlighting</a>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}

          {loading && phase !== "generating" && (
            <div className="flex items-start gap-3"><Avatar />
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 rounded-full bg-[#C84EC4] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#C84EC4] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#C84EC4] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {phase === "generating" && loading && (
            <div className="flex items-start gap-3"><Avatar />
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm border border-gray-100 max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 border-2 border-[#C84EC4] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-[#1C2B5E]">Sending your report…</span>
                </div>
                <p className="text-xs text-gray-400">Just a moment while we prepare your PDF.</p>
              </div>
            </div>
          )}

          {(phase === "email_gate" || phase === "generating" || phase === "complete") && matchResult && (
            <div className="flex items-start gap-3"><Avatar />
              <div className="max-w-sm w-full space-y-3">
                <div className="bg-[#1C2B5E] text-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                  <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold mb-1">Your Qualifying Programs Report</p>
                  <p className="text-3xl font-black mb-1">{matchResult.programCount} Programs Found</p>
                  <p className="text-xs text-blue-200 leading-relaxed">{matchResult.summary || `Based on your facility profile, we identified ${matchResult.programCount} qualifying programs across utility rebates, state grants, and federal incentives.`}</p>
                  {phase === "complete" && (
                    <button onClick={downloadPDF} disabled={pdfBusy} className="mt-4 w-full bg-[#C84EC4] hover:bg-[#a83ea5] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      {pdfBusy ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating PDF…</>) : (<><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Download Full PDF Report</>)}
                    </button>
                  )}
                </div>
                {matchResult.programs?.map((group) => (
                  <div key={group.measure} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-[#1C2B5E]/5 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C2B5E]">{group.measure}</span>
                      <span className="text-xs text-gray-400">{group.entries.length} program{group.entries.length !== 1 ? "s" : ""}</span>
                    </div>
                    {group.entries.map((p, i) => (
                      <div key={i} className={`px-4 py-3 text-xs ${i > 0 ? "border-t border-gray-100" : ""}`}>
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <span className="font-semibold text-[#1C2B5E]">{p.name}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${p.category === "Utility Rebate" ? "bg-blue-100 text-blue-700" : p.category === "State Grant" ? "bg-cyan-100 text-cyan-700" : p.category === "Federal Tax Credit" ? "bg-[#C84EC4]/10 text-[#C84EC4]" : "bg-fuchsia-100 text-fuchsia-700"}`}>{p.category}</span>
                        </div>
                        <p className="text-gray-500">{p.administrator}{p.deadline ? ` · ${p.deadline}` : ""}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "email_gate" && !loading && (
            <div className="flex items-start gap-3"><Avatar />
              <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-gray-100 max-w-sm w-full">
                <p className="text-sm font-semibold text-[#1C2B5E] mb-1">Get the full PDF report in your inbox</p>
                <p className="text-xs text-gray-500 mb-3">We'll email you the complete breakdown with deadlines, incentive amounts, and next steps — no spam.</p>
                <form onSubmit={handleEmailSubmit} className="space-y-2">
                  <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4]" />
                  <div className="flex gap-2">
                    <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4]" />
                    <button type="submit" className="bg-[#C84EC4] hover:bg-[#a83ea5] text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap">Send Report</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {phase === "complete" && !loading && (
            <>
              <div className="flex items-start gap-3">
                <Avatar />
                <div className="bg-[#C84EC4] border border-[#C84EC4] rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm w-full flex items-start gap-3">
                  <svg className="w-5 h-5 text-white flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  <div>
                    <p className="text-sm font-semibold text-white">Report sent!</p>
                    <p className="text-xs text-white/90 mt-0.5">Check your inbox{name ? `, ${name}` : ""} — your PDF report is on its way to <span className="font-semibold">{email}</span>.</p>
                  </div>
                </div>
              </div>
              <button onClick={() => window.location.href = "/"} className="w-full max-w-sm mx-auto block text-xs text-gray-400 hover:text-gray-600 py-2 text-center transition-colors">← Start a new search</button>
            </>
          )}

          {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}

          {phase === "conversation" && (
            <div className="pt-2 pb-4">
              <form onSubmit={handleSend} className="flex gap-2">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder={loading ? "…" : "Type your answer…"} className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4] disabled:opacity-50 bg-white shadow-sm" />
                <button type="submit" disabled={!input.trim() || loading} className="bg-[#1C2B5E] hover:bg-[#2a3d7e] disabled:opacity-40 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors flex items-center gap-1.5">
                  Send
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                </button>
              </form>
              <p className="text-xs text-gray-300 mt-2">Your information is used only to match and generate your report.</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return <img src="/enlighting-logo-optimized.png" alt="Enlighting" className="h-8 w-auto max-w-[80px] object-contain flex-shrink-0 mt-0.5" />;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <Avatar />}
      <div className={`max-w-[80%] sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "bg-[#1C2B5E] text-white rounded-tr-sm ml-auto" : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"}`}>
        {message.content}
      </div>
    </div>
  );
}
