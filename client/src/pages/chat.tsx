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
          <img src="/Enlighting_Logo_White_Web_1763150856949.png" alt="Enlighting Energy" className="h-10 w-auto max-w[140px] object-contain flex-shrink-0" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-xs text-blue-200 mt-0.5">California Energy Incentives</span>
          </div>
        </a>
        {phase === "conversation" && stepCount > 0 && (
          <div className="text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-full">
            {stepCount < 3 ? "Getting started…" : stepCount < 5 ? "Almost there…" : "Finalizing…"}
          </div>
        )}
        <a href="https://enlightingenergy.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-200 hover:text-white border border-blue-200/30 hover:border-blue-200/60 rounded-full pxL�KLH�[��][ۋX��ܜ��]\�X�K[��ܘ\��X��][�Y�[���O���XY\����]��\�Ә[YOH��^LHݙ\����^KX]]�MKM����]��\�Ә[YOH�X^]�L�^X]]��X�K^KM����Y\��Y�\˛X\

\��JHO�Y\��Y�P�X��H�^O^�_HY\��Y�O^�\��Hϊ_B����Y[��	��\�HOOH��[�\�][�Ȉ	��
�]��\�Ә[YOH��^][\�\�\��\Lȏ�]�]\�ς�]��\�Ә[YOH���]�]H��[�YL���[�Y]\�HMKL��Y��\�H�ܙ\��ܙ\�Yܘ^KLL���]��\�Ә[YOH��^�\LH][\�X�[�\�MH����[��\�Ә[YOH��L�L���[�YY�[��V���
P�H[�[X]KX��[��H��[O^��[�[X][ۑ[^N��\Ȉ_Hς��[��\�Ә[YOH��L�L���[�YY�[��V���
P�H[�[X]KX��[��H��[O^��[�[X][ۑ[^N��ML\Ȉ_Hς��[��\�Ә[YOH��L�L���[�YY�[��V���
P�H[�[X]KX��[��H��[O^��[�[X][ۑ[^N���\Ȉ_Hς��]����]����]���
_B���\�HOOH��[�\�][�Ȉ	���Y[��	��
�]��\�Ә[YOH��^][\�\�\��\Lȏ�]�]\�ς�]��\�Ә[YOH���]�]H��[�YL���[�Y]\�HMKM�Y��\�H�ܙ\��ܙ\�Yܘ^KLLX^]�^ȏ��]��\�Ә[YOH��^][\�X�[�\��\L�X�L����]��\�Ә[YOH��MM�ܙ\�L��ܙ\�V���
P�H�ܙ\�]]�[��\�[���[�YY�[[�[X]K\�[��ς��[��\�Ә[YOH�^\�H�۝[YY][H^V��P̐�QWH���[�[��[�\��\ܝ8�)���[����]����\�Ә[YOH�^^�^Yܘ^KM���\�H[�Y[��[H�H�\\�H[�\�������]����]���
_B���\�HOOH�[XZ[��]H�\�HOOH��[�\�][�Ȉ\�HOOH���\]H�H	��X]��\�[	��
�]��\�Ә[YOH��^][\�\�\��\Lȏ�]�]\�ς�]��\�Ә[YOH�X^]�\�H�Y�[�X�K^KLȏ��]��\�Ә[YOH���V��P̐�QWH^]�]H��[�YL���[�Y]\�HMHKM�Y��\�H����\�Ә[YOH�^^�^X�YKL�\\��\�H�X��[��]�Y\��۝\�[ZX��X�LH��[�\�]X[Y�Z[����ܘ[\��\ܝ����\�Ә[YOH�^L��۝X�X��X�LH���X]��\�[���ܘ[P��[�H��ܘ[\���[�����\�Ә[YOH�^^�^X�YKL�XY[��\�[^Y���X]��\�[��[[X\�H�\�Yۈ[�\��X�[]H�ٚ[K�HY[�Y�YY	�X]��\�[���ܘ[P��[�H]X[Y�Z[����ܘ[\�Xܛ���][]H�X�]\��]Hܘ[��[��Y\�[[��[�]�\˘O����\�HOOH���\]H�	��
��]ۈې�X��^��ۛ�Y�H\�X�Y^���\�_H�\�Ә[YOH�]M�Y�[��V���
P�Hݙ\����V��N�XMWH\�X�Y��X�]KM�^]�]H�۝X��KL��H��[�Y^^\�H�[��][ۋX��ܜ��^][\�X�[�\��\�Y�KX�[�\��\L�������\�H�
��[��\�Ә[YOH��MM�ܙ\�L��ܙ\�]�]H�ܙ\�]]�[��\�[���[�YY�[[�[X]K\�[��ϑ�[�\�][����)�ϊH�
�ݙ��\�Ә[YOH��MM��[H��ۙH��Y]Л�H��������OH��\��[���܈�����U�Y^̟O�]����S[�X�\H���[������S[�Z��[�H���[��H�L�M��]����PL���H���H
K��H�ZLˍPL���H���H�HN��U�M��SLM��HL�L�M��[L
ˍHL�M�H
�U�ȈϏ�ݙϑ�ۛ�Y�[��\ܝϊ_B�؝]ۏ��
_B��]����X]��\�[���ܘ[\�˛X\

ܛ�\
HO�
�]��^O^�ܛ�\�YX\�\�_H�\�Ә[YOH���]�]H��[�Y^�ܙ\��ܙ\�Yܘ^KL��Y��\�Hݙ\����ZY[����]��\�Ә[YOH���V��P̐�QWK�H�ܙ\�X��ܙ\�Yܘ^KLLMKL��^][\�X�[�\��\�Y�KX�]�Y[�����[��\�Ә[YOH�^^��۝X��^V��P̐�QWH���ܛ�\�YX\�\�_O��[����[��\�Ә[YOH�^^�^Yܘ^KM���ܛ�\�[��Y\˛[��H��ܘ[^�ܛ�\�[��Y\˛[��OOHH��Ȉ���O��[����]����ܛ�\�[��Y\˛X\

JHO�
�]��^O^�_H�\�Ә[YO^�MKL�^^�	�H����ܙ\�]�ܙ\�Yܘ^KLL����XO��]��\�Ә[YOH��^][\�\�\��\�Y�KX�]�Y[��\L�X�L�H����[��\�Ә[YOH��۝\�[ZX��^V��P̐�QWH�����[Y_O��[����[��\�Ә[YO^�L�KL�H��[�YY�[�۝X���^\��[��L	���]Y�ܞHOOH�][]H�X�]H�����X�YKLL^X�YKM�����]Y�ܞHOOH��]Hܘ[������X�X[�LL^X�X[�M�����]Y�ܞHOOH��Y\�[^ܙY]�����V���
P�K�L^V���
P�H�����Y�X��XKLL^Y�X��XKM��XO����]Y�ܞ_O��[����]����\�Ә[YOH�^Yܘ^KML����YZ[�\��]ܟ^��XY[�H�0��	��XY[�_X���O����]���
J_B��]���
J_B��]����]���
_B���\�HOOH�[XZ[��]H�	��[�Y[��	��
�]��\�Ә[YOH��^][\�\�\��\Lȏ�]�]\�ς�]��\�Ә[YOH���]�]H��[�YL���[�Y]\�HMHKM�Y��\�H�ܙ\��ܙ\�Yܘ^KLLX^]�\�H�Y�[����\�Ә[YOH�^\�H�۝\�[ZX��^V��P̐�QWHX�LH���]H�[��\ܝ[�[�\�[�������\�Ә[YOH�^^�^Yܘ^KMLX�Lȏ��I�[XZ[[�HH��\]H��XZ��ۈ�]XY[�\�[��[�]�H[[�[��[��^�\�8�%���[K�����ܛH۔�X�Z]^�[�Q[XZ[�X�Z]H�\�Ә[YOH��X�K^KL����[�]\OH�^�X�Z�\�H�[�\��[YH��[YO^ۘ[Y_Hې�[��O^�JHO��]�[YJK�\��]��[YJ_H�\�Ә[YOH��Y�[�ܙ\��ܙ\�Yܘ^KL���[�Y[�L�KL�^\�H���\Λ�][�K[�ۙH���\Μ�[��L����\Μ�[��V���
P�H�ς�]��\�Ә[YOH��^�\L����[�]\OH�[XZ[��\]Z\�YX�Z�\�H�[�P��\[�K���H��[YO^�[XZ[Hې�[��O^�JHO��][XZ[
K�\��]��[YJ_H�\�Ә[YOH��^LH�ܙ\��ܙ\�Yܘ^KL���[�Y[�L�KL�^\�H���\Λ�][�K[�ۙH���\Μ�[��L����\Μ�[��V���
P�H�ς��]ۈ\OH��X�Z]��\�Ә[YOH���V���
P�Hݙ\����V��N�XMWH^]�]H�۝X��MKL���[�Y[�^\�H�[��][ۋX��ܜ��]\�X�K[��ܘ\���[��\ܝ؝]ۏ���]���ٛܛO���]����]���
_B���\�HOOH���\]H�	��[�Y[��	��
���]��\�Ә[YOH��^][\�\�\��\Lȏ��]�]\�ς�]��\�Ә[YOH���V���
P�H�ܙ\��ܙ\�V���
P�H��[�YL���[�Y]\�HMKL�X^]�\�H�Y�[�^][\�\�\��\Lȏ��ݙ��\�Ә[YOH��MHMH^]�]H�^\��[��L]L�H��[H��ۙH��Y]Л�H��������OH��\��[���܈�����U�Y^̋�_O�]����S[�X�\H���[������S[�Z��[�H���[��H�NHL���HLK��HMHMHK��SL�HL�NHHHKLNHHHN��Ϗ�ݙς�]����\�Ә[YOH�^\�H�۝\�[ZX��^]�]H���\ܝ�[�O����\�Ә[YOH�^^�^]�]K�L]L�H���X��[�\�[���ۘ[YH�	ۘ[Y_X���H8�%[�\���\ܝ\�ۈ]��^H��[��\�Ә[YOH��۝\�[ZX�����[XZ[O��[�������]����]����]����]ۈې�X��^�
HO��[��˛��][ۋ��Y�H�ȟH�\�Ә[YOH��Y�[X^]�\�H^X]]�����^^�^Yܘ^KMݙ\��^Yܘ^KM�KL�^X�[�\��[��][ۋX��ܜȏ����\�H�]��X\��؝]ۏ��ς�
_B���\��܈	���\�Ә[YOH�^\�YML^\�H^X�[�\�KL����\��ܟO��B���\�HOOH��۝�\��][ۈ�	��
�]��\�Ә[YOH�L��M����ܛH۔�X�Z]^�[�T�[�H�\�Ә[YOH��^�\L����[�]�Y�^�[�]�Y�H\OH�^��[YO^�[�]Hې�[��O^�JHO��][�]
K�\��]��[YJ_H\�X�Y^��Y[��HX�Z�\�^��Y[�����)����\H[�\�[���\��)��H�\�Ә[YOH��^LH�ܙ\��ܙ\�Yܘ^KL���[�Y^MKL�^\�H���\Λ�][�K[�ۙH���\Μ�[��L����\Μ�[��V���
P�H\�X�Y��X�]KML��]�]H�Y��\�H�ς��]ۈ\OH��X�Z]�\�X�Y^�Z[�]��[J
H�Y[��H�\�Ә[YOH���V��P̐�QWHݙ\����V�̘L�
�WH\�X�Y��X�]KM^]�]H�۝X��MHKL���[�Y^^\�H�[��][ۋX��ܜ��^][\�X�[�\��\LK�H����[��ݙ��\�Ә[YOH��LˍHLˍH��[H��ۙH��Y]Л�H��������OH��\��[���܈�����U�Y^̋�_O�]����S[�X�\H���[������S[�Z��[�H���[��H�M�L�ˌ��HˌL�PMNK�͎H
NK�͎HH�K�
HL�
NK�͎
NK�͎Hˌ����
�S
K�NNHL��L
ˍH�Ϗ�ݙς�؝]ۏ��ٛܛO���\�Ә[YOH�^^�^Yܘ^KL�]L���[�\�[��ܛX][ۈ\�\�YۛH�X]�[��[�\�]H[�\��\ܝ�����]���
_B��]��Y�^�Y\��Y�\�[��Y�Hς��]����]����]���
NB���[��[ۈ]�]\�
H�]\��[Y�ܘ�H��[�Y�[��[���[�[Z^�Y��Ȉ[H�[�Y�[�Ȉ�\�Ә[YOH�N�X]]�X^]�V�Hؚ�X�X�۝Z[��^\��[��L]L�H�ώB���[��[ۈY\��Y�P�X��J�Y\��Y�HN��Y\��Y�N�Y\��Y�HJH�ۜ�\�\�\�HY\��Y�K���HOOH�\�\���]\��
�]��\�Ә[YO^��^][\�\�\��\L�	�\�\�\����^\���\�]�\��H����XO���Z\�\�\�	��]�]\�ϟB�]��\�Ә[YO^�X^]�V�	WH�N�X^]�[YMKL���[�YL�^\�HXY[��\�[^Y�]\�X�K\�K]ܘ\	�\�\�\�����V��P̐�QWH^]�]H��[�Y]�\�H[X]]Ȉ����]�]H^Yܘ^KN��[�Y]\�H�Y��\�H�ܙ\��ܙ\�Yܘ^KLL�XO���Y\��Y�K��۝[�B��]����]���
NB
