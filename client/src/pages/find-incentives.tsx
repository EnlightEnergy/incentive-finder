import { useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────

const FACILITY_TYPES = [
  'Commercial Office',
  'Retail',
  'Warehouse / Distribution',
  'Industrial / Manufacturing',
  'Cold Storage / Refrigerated Warehouse',
  'Hotel / Hospitality',
  'Multifamily (5+ units)',
  'School / Education',
  'Government / Municipal',
  'Agricultural / Farm',
];

const MEASURES = [
  'LED Lighting',
  'HVAC',
  'VFD / Motors',
  'Refrigeration',
  'Solar / PV',
  'Battery Storage',
  'EV Charging',
  'Building Envelope',
  'Compressed Air',
  'Boilers / Steam',
  'Process Equipment',
];

type Step = 'facility' | 'measures' | 'loading' | 'results';

interface FormState {
  facilityName: string;
  zip: string;
  facilityType: string;
  sqFt: string;
  utility: string;
  measures: string[];
}

// ── Component ─────────────────────────────────────────────────────────────

export default function FindIncentives() {
  const [step, setStep]   = useState<Step>('facility');
  const [form, setForm]   = useState<FormState>({
    facilityName: '', zip: '', facilityType: '', sqFt: '', utility: '', measures: [],
  });
  const [matchResult, setMatchResult] = useState<any>(null);
  const [error, setError]     = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [utilityHint, setUtilityHint] = useState('');

  // Auto-detect utility when ZIP is complete
  async function onZipBlur() {
    if (form.zip.length !== 5) return;
    try {
      const r = await fetch(`/api/utility/${form.zip}`);
      if (r.ok) {
        const d = await r.json();
        const u = d.utilities?.[0] || '';
        setForm(f => ({ ...f, utility: u }));
        setUtilityHint(u ? `Auto-detected: ${u}` : 'Utility not found — please enter manually');
      }
    } catch { /* silent */ }
  }

  function toggleMeasure(m: string) {
    setForm(f => ({
      ...f,
      measures: f.measures.includes(m) ? f.measures.filter(x => x !== m) : [...f.measures, m],
    }));
  }

  async function runMatch() {
    if (!form.zip || !form.facilityType || form.measures.length === 0) {
      setError('Please complete all fields and select at least one measure.');
      return;
    }
    setStep('loading');
    setError('');
    try {
      const r = await fetch('/api/match-programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip:          form.zip,
          utility:      form.utility,
          facilityType: form.facilityType,
          facilityName: form.facilityName,
          measures:     form.measures,
          sqFt:         form.sqFt ? parseInt(form.sqFt.replace(/,/g, ''), 10) : undefined,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setMatchResult(await r.json());
      setStep('results');
    } catch (e: any) {
      setError('Matching failed: ' + (e.message || 'Unknown error'));
      setStep('measures');
    }
  }

  async function downloadPDF() {
    if (!matchResult) return;
    setPdfBusy(true);
    setError('');
    try {
      const r = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchResult),
      });
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'qualifying-programs-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError('PDF generation failed: ' + (e.message || 'Unknown error'));
    }
    setPdfBusy(false);
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1C2B5E] text-white py-10 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#C84EC4]/20 text-[#C84EC4] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Incentive Finder 2.0
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Find Your Qualifying Programs</h1>
          <p className="text-blue-200 text-sm">
            Enter your facility details and we'll match you to every utility rebate, state grant, and federal incentive you qualify for — and generate a full PDF report.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto flex">
          {(['facility', 'measures', 'results'] as const).map((s, i) => {
            const active   = step === s || (step === 'loading' && s === 'measures');
            const complete = (step === 'measures' && s === 'facility') ||
                             (step === 'loading'  && s !== 'results') ||
                             (step === 'results');
            const label    = ['1. Facility', '2. Measures', '3. Results'][i];
            return (
              <div key={s} className={`flex-1 py-3 text-center text-xs font-bold border-b-2 ${active ? 'border-[#C84EC4] text-[#C84EC4]' : complete ? 'border-[#1C2B5E] text-[#1C2B5E]' : 'border-transparent text-gray-400'}`}>
                {label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* ── Step 1: Facility ── */}
        {step === 'facility' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-[#1C2B5E] mb-1">Tell us about your facility</h2>
            <p className="text-gray-500 text-sm mb-6">We use this to filter programs to your location and building type.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Facility Name</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4]"
                  placeholder="e.g. Acme Warehouse – Fresno"
                  value={form.facilityName}
                  onChange={e => setForm(f => ({ ...f, facilityName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">ZIP Code *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4]"
                    placeholder="e.g. 93701"
                    maxLength={5}
                    value={form.zip}
                    onChange={e => setForm(f => ({ ...f, zip: e.target.value.replace(/\D/g, '') }))}
                    onBlur={onZipBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Utility *
                    {utilityHint && <span className="text-[#C84EC4] ml-1 normal-case font-normal">{utilityHint}</span>}
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4]"
                    placeholder="e.g. SCE, PG&E"
                    value={form.utility}
                    onChange={e => setForm(f => ({ ...f, utility: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Facility Type *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4] bg-white"
                  value={form.facilityType}
                  onChange={e => setForm(f => ({ ...f, facilityType: e.target.value }))}
                >
                  <option value="">Select a facility type…</option>
                  {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Square Footage</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C84EC4]"
                  placeholder="e.g. 50,000"
                  value={form.sqFt}
                  onChange={e => setForm(f => ({ ...f, sqFt: e.target.value }))}
                />
              </div>
            </div>

            {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

            <button
              className="mt-8 w-full bg-[#1C2B5E] text-white font-bold py-3 rounded-xl hover:bg-[#2a3d7e] transition-colors"
              onClick={() => {
                if (!form.zip || !form.facilityType || !form.utility) {
                  setError('ZIP code, utility, and facility type are required.');
                  return;
                }
                setError('');
                setStep('measures');
              }}
            >
              Next: Select Measures →
            </button>
          </div>
        )}

        {/* ── Step 2: Measures ── */}
        {step === 'measures' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-[#1C2B5E] mb-1">What are you looking to upgrade?</h2>
            <p className="text-gray-500 text-sm mb-6">Select all that apply. We'll match programs for each selected measure.</p>

            <div className="grid grid-cols-2 gap-3">
              {MEASURES.map(m => {
                const selected = form.measures.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggleMeasure(m)}
                    className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selected
                        ? 'border-[#C84EC4] bg-[#C84EC4]/10 text-[#4B3082]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#1C2B5E]'
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}{m}
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button
                className="flex-1 border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:border-gray-400 transition-colors"
                onClick={() => setStep('facility')}
              >
                ← Back
              </button>
              <button
                disabled={form.measures.length === 0}
                className="flex-1 bg-[#C84EC4] text-white font-bold py-3 rounded-xl hover:bg-[#a83ea5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={runMatch}
              >
                Find My Programs →
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {step === 'loading' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#C84EC4] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-[#1C2B5E] mb-2">Scanning incentive programs…</h2>
            <p className="text-gray-500 text-sm">Checking utility rebates, state grants, and federal programs for your facility.</p>
          </div>
        )}

        {/* ── Step 3: Results ── */}
        {step === 'results' && matchResult && (
          <div className="space-y-6">
            {/* Summary card */}
            <div className="bg-[#1C2B5E] text-white rounded-2xl p-6">
              <p className="text-[#BBA8E0] text-xs font-bold uppercase tracking-widest mb-1">Results for {matchResult.facility?.utility} · {matchResult.facility?.zip}</p>
              <h2 className="text-2xl font-extrabold mb-1">{matchResult.programCount} Qualifying Program{matchResult.programCount !== 1 ? 's' : ''} Found</h2>
              <p className="text-blue-200 text-sm mb-4">{matchResult.summary}</p>
              <button
                onClick={downloadPDF}
                disabled={pdfBusy}
                className="inline-flex items-center gap-2 bg-[#C84EC4] hover:bg-[#a83ea5] text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
              >
                {pdfBusy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>⬇ Download Full Report (PDF)</>
                )}
              </button>
            </div>

            {/* Programs by measure */}
            {matchResult.programs?.map((group: any) => (
              <div key={group.measure} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#1C2B5E] text-white px-6 py-3 flex items-center justify-between">
                  <span className="font-bold">⚡ {group.measure}</span>
                  <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{group.entries.length} program{group.entries.length !== 1 ? 's' : ''}</span>
                </div>
                {group.entries.map((p: any, i: number) => (
                  <div key={i} className={`px-6 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-[#1C2B5E] text-sm">{p.name}</h3>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap flex-shrink-0">{p.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Administered by <strong>{p.administrator}</strong></p>
                    {p.incentiveStructure && (
                      <p className="text-xs text-gray-700 mb-1"><strong>Incentive:</strong> {p.incentiveStructure}</p>
                    )}
                    <div className="flex gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-gray-500">📅 Deadline: {p.deadline}</span>
                      {p.preApprovalRequired && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">⚠ Pre-approval required</span>
                      )}
                    </div>
                    {p.nextStep && (
                      <p className="text-xs text-[#4B3082] mt-2 font-medium">→ {p.nextStep}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {matchResult.programs?.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                <p className="text-lg font-bold mb-2">No programs found</p>
                <p className="text-sm">No open programs matched your exact profile. Try different measures or contact us for a manual review.</p>
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              className="w-full border-2 border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:border-gray-400 transition-colors"
              onClick={() => { setStep('facility'); setMatchResult(null); setError(''); }}
            >
              ← Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
