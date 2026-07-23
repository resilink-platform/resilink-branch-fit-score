"use client";

import { useState, useEffect, useCallback, type ReactNode, type CSSProperties } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Sparkles, RotateCcw, Share2, Check, Activity, AlertTriangle,
} from "lucide-react";
import {
  fetchQuestions, submitResidentAnswers,
  type Question, type BranchFitResponse,
} from "@/lib/api";

/* ─── Theme ─────────────────────────────────────────────────────────── */
const C = {
  bg: "#0a0e1a", card: "#121829", border: "rgba(56, 189, 248, 0.14)", borderStrong: "rgba(56, 189, 248, 0.4)",
  cyan: "#22d3ee", cyanSoft: "rgba(34, 211, 238, 0.12)", text: "#e8edf5", textDim: "#8b97ad", textFaint: "#5a6478",
  good: "#34d399", warn: "#fbbf24", danger: "#f87171",
};
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const DIMENSIONS = [
  "procedural", "patient_interaction", "work_life_balance", "stress_tolerance", "manual_dexterity",
  "academic", "emergency", "tech_affinity", "income", "stamina",
] as const;
const SHORT = ["Procedural", "Patient", "Work-life", "Stress", "Manual", "Academic", "Emergency", "Tech", "Income", "Stamina"];

const SCALE = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
];

const TYPE_COLOR: Record<string, string> = { MS: "#38bdf8", MD: "#34d399", Para: "#fbbf24", Pre: "#a78bfa" };

const BRANCHES = [
  "General Surgery", "Orthopedics", "OBG", "Ophthalmology", "ENT",
  "General Medicine", "Pediatrics", "Psychiatry", "Dermatology (DVL)",
  "Radiology", "Anesthesiology", "Pulmonary Medicine", "Emergency Medicine",
  "Pathology", "Microbiology", "Pharmacology", "Community Medicine (PSM)",
  "Forensic Medicine", "Biochemistry", "Anatomy",
];

const WORK_OPTS = [
  { value: "or_procedures",     label: "Operating Room / Procedures" },
  { value: "icu_emergency",     label: "ICU / Emergency" },
  { value: "opd_clinic",        label: "OPD / Clinic" },
  { value: "lab_microscopy",    label: "Lab / Microscopy" },
  { value: "radiology_console", label: "Radiology Console / Reporting" },
  { value: "community",         label: "Community / Field work" },
];

const AGE_OPTS = [
  { value: "neonates_children",  label: "Neonates / Children" },
  { value: "adults",             label: "Adults" },
  { value: "no_preference",      label: "Any / No preference" },
  { value: "prefer_no_patients", label: "Prefer minimal patient contact" },
];

const CAREER_OPTS = [
  { value: "superspecialization", label: "Superspecialization (DM/MCh)" },
  { value: "private_practice",    label: "Lucrative private practice" },
  { value: "teaching_academics",  label: "Teaching / Academics" },
  { value: "public_health",       label: "Public health / Community impact" },
  { value: "research_industry",   label: "Research / Industry" },
  { value: "entrepreneurship",    label: "Build my own practice / Startup" },
];

const CHOOSE_AGAIN_OPTS = [
  { value: "definitely_yes", label: "Definitely yes" },
  { value: "probably_yes",   label: "Probably yes" },
  { value: "unsure",         label: "Unsure" },
  { value: "probably_no",    label: "Probably no" },
  { value: "definitely_no",  label: "Definitely no" },
];

const WORKLOAD_OPTS = [
  { value: "exactly_as_expected",  label: "Exactly as expected" },
  { value: "harder_than_expected", label: "Harder than expected" },
  { value: "easier_than_expected", label: "Easier than expected" },
];

type Screen = "landing_resident" | "identity" | "quiz" | "categorical" | "golden" | "calculating" | "results" | "error";

/* ─── Main ──────────────────────────────────────────────────────────── */
export default function ResidentPage() {
  const [screen, setScreen] = useState<Screen>("landing_resident");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [results, setResults] = useState<BranchFitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Identity
  const [selectedBranch, setSelectedBranch] = useState("");
  const [yearOfResidency, setYearOfResidency] = useState<number | null>(null);
  const [wasFirstChoice, setWasFirstChoice] = useState<boolean | null>(null);
  const [instituteType, setInstituteType] = useState("");

  // Categorical Q41–Q43
  const [catStep, setCatStep] = useState(0);
  const [workSetting, setWorkSetting] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState("");
  const [careerVision, setCareerVision] = useState("");

  // Golden Q44–Q45
  const [goldenStep, setGoldenStep] = useState(0);
  const [wouldChooseAgain, setWouldChooseAgain] = useState("");
  const [workloadReality, setWorkloadReality] = useState("");

  const loadQuestions = useCallback(() => {
    setQLoading(true); setErrorMsg("");
    fetchQuestions()
      .then((qs) => { setQuestions(qs); setAnswers(Array(qs.length).fill(null)); setQLoading(false); })
      .catch((e: Error) => { setErrorMsg(e.message); setQLoading(false); setScreen("error"); });
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    if (screen !== "calculating") return;
    let active = true;
    const start = Date.now();
    submitResidentAnswers(
      answers as number[],
      selectedBranch,
      yearOfResidency ?? 1,
      wasFirstChoice ?? false,
      instituteType,
      wouldChooseAgain,
      workloadReality,
      workSetting,
      ageGroup,
      careerVision,
    )
      .then(async (res) => {
        const wait = Math.max(0, 1600 - (Date.now() - start));
        await new Promise((r) => setTimeout(r, wait));
        if (active) { setResults(res); setScreen("results"); }
      })
      .catch((e: Error) => { if (active) { setErrorMsg(e.message); setScreen("error"); } });
    return () => { active = false; };
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quiz handlers
  const answer = (val: number) => {
    const next = [...answers]; next[qi] = val; setAnswers(next);
    setTimeout(() => {
      if (qi < questions.length - 1) setQi(qi + 1);
      else setScreen("categorical");
    }, 180);
  };
  const quizBack = () => { if (qi > 0) setQi(qi - 1); else setScreen("identity"); };

  // Categorical handlers
  const toggleWorkSetting = (val: string) =>
    setWorkSetting((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  const continueQ41 = () => setCatStep(1);
  const selectAgeGroup = (val: string) => { setAgeGroup(val); setTimeout(() => setCatStep(2), 180); };
  const selectCareerVision = (val: string) => setCareerVision(val);
  const seeGolden = () => setScreen("golden");
  const catBack = () => {
    if (catStep > 0) setCatStep(catStep - 1);
    else { setQi(questions.length - 1); setScreen("quiz"); }
  };

  // Golden handlers
  const selectChooseAgain = (val: string) => { setWouldChooseAgain(val); setTimeout(() => setGoldenStep(1), 180); };
  const selectWorkload = (val: string) => { setWorkloadReality(val); setTimeout(() => setScreen("calculating"), 180); };
  const goldenBack = () => {
    if (goldenStep > 0) { setGoldenStep(goldenStep - 1); }
    else { setCatStep(2); setScreen("categorical"); }
  };

  const restart = () => {
    setAnswers(Array(questions.length).fill(null));
    setQi(0); setResults(null);
    setCatStep(0); setWorkSetting([]); setAgeGroup(""); setCareerVision("");
    setGoldenStep(0); setWouldChooseAgain(""); setWorkloadReality("");
    setSelectedBranch(""); setYearOfResidency(null); setWasFirstChoice(null); setInstituteType("");
    setScreen("landing_resident");
  };

  const identityComplete = selectedBranch && yearOfResidency !== null && wasFirstChoice !== null && instituteType;

  const wrap: CSSProperties = {
    minHeight: "100vh", background: C.bg, fontFamily: FONT, color: C.text,
    display: "flex", justifyContent: "center", padding: "28px 16px",
  };

  return (
    <div style={wrap}>
      <style>{`
        .bfs-opt { transition: all .14s ease; }
        .bfs-opt:hover { border-color: ${C.cyan} !important; box-shadow: 0 0 18px rgba(34,211,238,.22); transform: translateY(-1px); }
        .bfs-cta { transition: all .16s ease; }
        .bfs-cta:hover { box-shadow: 0 0 30px rgba(34,211,238,.55); transform: translateY(-1px); }
        .bfs-cta:disabled { opacity: .55; cursor: default; box-shadow: none; transform: none; }
        .bfs-ghost { transition: all .14s ease; }
        .bfs-ghost:hover { border-color: ${C.borderStrong} !important; color: ${C.text} !important; }
        @keyframes bfsSpin { to { transform: rotate(360deg); } }
        @keyframes bfsPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes bfsFade { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform:none;} }
        .bfs-fade { animation: bfsFade .34s ease; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 540 }}>
        {screen === "landing_resident" && (
          <LandingResident loading={qLoading} onStart={() => setScreen("identity")} />
        )}
        {screen === "identity" && (
          <Identity
            selectedBranch={selectedBranch}
            yearOfResidency={yearOfResidency}
            wasFirstChoice={wasFirstChoice}
            instituteType={instituteType}
            onBranch={setSelectedBranch}
            onYear={setYearOfResidency}
            onFirstChoice={setWasFirstChoice}
            onInstituteType={setInstituteType}
            canContinue={!!identityComplete}
            onContinue={() => { setQi(0); setScreen("quiz"); }}
            onBack={() => setScreen("landing_resident")}
          />
        )}
        {screen === "quiz" && questions[qi] && (
          <Quiz qi={qi} total={questions.length} q={questions[qi]} selected={answers[qi]} onAnswer={answer} onBack={quizBack} />
        )}
        {screen === "categorical" && (
          <Categorical
            catStep={catStep}
            workSetting={workSetting}
            ageGroup={ageGroup}
            careerVision={careerVision}
            onToggleWork={toggleWorkSetting}
            onContinueWork={continueQ41}
            onSelectAge={selectAgeGroup}
            onSelectCareer={selectCareerVision}
            onSeeResults={seeGolden}
            onBack={catBack}
          />
        )}
        {screen === "golden" && (
          <Golden
            goldenStep={goldenStep}
            selectedBranch={selectedBranch}
            wouldChooseAgain={wouldChooseAgain}
            workloadReality={workloadReality}
            onChooseAgain={selectChooseAgain}
            onWorkload={selectWorkload}
            onBack={goldenBack}
          />
        )}
        {screen === "calculating" && <Calculating />}
        {screen === "results" && results && (
          <ResidentResults data={results} selectedBranch={selectedBranch} onRestart={restart} />
        )}
        {screen === "error" && (
          <ErrorScreen
            msg={errorMsg}
            onRetry={questions.length === 0
              ? () => { setScreen("landing_resident"); loadQuestions(); }
              : () => setScreen("calculating")}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Landing Resident ───────────────────────────────────────────────── */
function LandingResident({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <div className="bfs-fade" style={{ textAlign: "center", paddingTop: 36 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 999,
        border: `1px solid ${C.border}`, background: C.cyanSoft, color: C.cyan, fontSize: 12.5, fontWeight: 500,
      }}>
        <Activity size={14} /> Resilink &middot; Resident Assessment
      </div>

      <h1 style={{ fontSize: 32, lineHeight: 1.2, fontWeight: 700, margin: "26px 0 0", letterSpacing: -0.5 }}>
        Help train our AI —<br />
        <span style={{ color: C.cyan, textShadow: "0 0 28px rgba(34,211,238,.45)" }}>and discover your own fit</span>
      </h1>

      <p style={{ color: C.textDim, fontSize: 15.5, lineHeight: 1.6, margin: "18px auto 0", maxWidth: 420 }}>
        Your responses help us match future aspirants to the right specialty. Takes 5 minutes. You&apos;ll see your own personality fit score at the end.
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "28px 0 0", flexWrap: "wrap" }}>
        {["43 questions", "~5 minutes", "See your own fit score"].map((c) => (
          <span key={c} style={{ padding: "8px 14px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, color: C.textDim, fontSize: 13.5 }}>
            {c}
          </span>
        ))}
      </div>

      <button className="bfs-cta" onClick={onStart} disabled={loading} style={{
        marginTop: 34, padding: "15px 40px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.cyan, color: "#04121a", fontSize: 16, fontWeight: 600, fontFamily: FONT,
        boxShadow: "0 0 22px rgba(34,211,238,.4)", display: "inline-flex", alignItems: "center", gap: 9,
      }}>
        {loading
          ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #04121a55", borderTopColor: "#04121a", animation: "bfsSpin .8s linear infinite", display: "inline-block" }} /> Loading</>
          : <><Sparkles size={18} /> Start &rarr;</>}
      </button>

      <p style={{ color: C.textFaint, fontSize: 12.5, marginTop: 22 }}>
        Be honest &mdash; there are no right or wrong answers.
      </p>
    </div>
  );
}

/* ─── Identity ───────────────────────────────────────────────────────── */
function Identity({
  selectedBranch, yearOfResidency, wasFirstChoice, instituteType,
  onBranch, onYear, onFirstChoice, onInstituteType, canContinue, onContinue, onBack,
}: {
  selectedBranch: string;
  yearOfResidency: number | null;
  wasFirstChoice: boolean | null;
  instituteType: string;
  onBranch: (v: string) => void;
  onYear: (v: number) => void;
  onFirstChoice: (v: boolean) => void;
  onInstituteType: (v: string) => void;
  canContinue: boolean;
  onContinue: () => void;
  onBack: () => void;
}) {
  const cardBtn = (selected: boolean): CSSProperties => ({
    flex: 1, padding: "13px 10px", borderRadius: 12, cursor: "pointer", fontFamily: FONT,
    fontSize: 14, fontWeight: selected ? 600 : 400, textAlign: "center",
    background: selected ? C.cyanSoft : C.card,
    border: `1.5px solid ${selected ? C.cyan : C.border}`,
    color: selected ? C.text : "#c3ccdb",
    boxShadow: selected ? "0 0 14px rgba(34,211,238,.2)" : "none",
  });

  return (
    <div className="bfs-fade" style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <button className="bfs-ghost" onClick={onBack} aria-label="Back" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, flexShrink: 0,
          borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, color: C.textDim, cursor: "pointer",
        }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Tell us about yourself</h2>
          <p style={{ color: C.textDim, fontSize: 14, margin: "4px 0 0" }}>This helps us tag your responses correctly.</p>
        </div>
      </div>

      {/* Field 1 — Branch */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 8 }}>
          Your current branch / specialty *
        </label>
        <select
          value={selectedBranch}
          onChange={(e) => onBranch(e.target.value)}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, fontSize: 15,
            background: C.card, border: `1px solid ${C.border}`,
            color: selectedBranch ? C.text : C.textDim,
            fontFamily: FONT, outline: "none",
          }}
        >
          <option value="" disabled>Select branch...</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Field 2 — Year */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 8 }}>
          Year of residency *
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ v: 1, label: "1st year" }, { v: 2, label: "2nd year" }, { v: 3, label: "3rd year+" }].map((opt) => (
            <button key={opt.v} className="bfs-opt" onClick={() => onYear(opt.v)} style={cardBtn(yearOfResidency === opt.v)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Field 3 — First choice */}
      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 8 }}>
          Was this specialty your first choice? *
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="bfs-opt" onClick={() => onFirstChoice(true)} style={cardBtn(wasFirstChoice === true)}>
            Yes — I chose this branch
          </button>
          <button className="bfs-opt" onClick={() => onFirstChoice(false)} style={cardBtn(wasFirstChoice === false)}>
            No — rank decided it
          </button>
        </div>
      </div>

      {/* Field 4 — Institute type */}
      <div style={{ marginBottom: 30 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.text, marginBottom: 8 }}>
          Institute type *
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          {["MD / MS", "DNB"].map((t) => (
            <button key={t} className="bfs-opt" onClick={() => onInstituteType(t)} style={cardBtn(instituteType === t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        className="bfs-cta"
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          width: "100%", padding: "15px", borderRadius: 12, border: "none",
          cursor: canContinue ? "pointer" : "default",
          background: C.cyan, color: "#04121a", fontSize: 15.5, fontWeight: 600, fontFamily: FONT,
          boxShadow: "0 0 22px rgba(34,211,238,.4)",
        }}
      >
        Continue &rarr;
      </button>
    </div>
  );
}

/* ─── Quiz ──────────────────────────────────────────────────────────── */
function Quiz({ qi, total, q, selected, onAnswer, onBack }: {
  qi: number; total: number; q: Question; selected: number | null; onAnswer: (v: number) => void; onBack: () => void;
}) {
  const pct = Math.round((qi / total) * 100);
  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <button className="bfs-ghost" onClick={onBack} aria-label="Back" style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, flexShrink: 0,
          borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, color: C.textDim, cursor: "pointer",
        }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 7, borderRadius: 99, background: "#1b2336", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: C.cyan, borderRadius: 99, transition: "width .35s ease", boxShadow: "0 0 12px rgba(34,211,238,.6)" }} />
          </div>
        </div>
        <span style={{ color: C.textDim, fontSize: 13, fontWeight: 500, flexShrink: 0, minWidth: 78, textAlign: "right" }}>
          {qi + 1} <span style={{ color: C.textFaint }}>/ {total}</span>
        </span>
      </div>

      <div key={qi} className="bfs-fade" style={{ marginTop: 30 }}>
        <div style={{ color: C.cyan, fontSize: 12.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          Question {qi + 1}
        </div>
        <h2 style={{ fontSize: 23, lineHeight: 1.4, fontWeight: 600, margin: 0, minHeight: 96 }}>{q.text}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
          {SCALE.map((opt) => {
            const on = selected === opt.v;
            return (
              <button key={opt.v} className="bfs-opt" onClick={() => onAnswer(opt.v)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: 12, cursor: "pointer",
                textAlign: "left", fontFamily: FONT, background: on ? C.cyanSoft : C.card,
                border: `1.5px solid ${on ? C.cyan : C.border}`, boxShadow: on ? "0 0 18px rgba(34,211,238,.25)" : "none",
              }}>
                <span style={{
                  width: 30, height: 30, flexShrink: 0, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, background: on ? C.cyan : "#1b2336", color: on ? "#04121a" : C.textDim,
                }}>
                  {on ? <Check size={16} /> : opt.v}
                </span>
                <span style={{ fontSize: 15.5, color: on ? C.text : "#c3ccdb", fontWeight: on ? 600 : 400 }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Categorical (Q41–Q43) ─────────────────────────────────────────── */
function Categorical({
  catStep, workSetting, ageGroup, careerVision,
  onToggleWork, onContinueWork, onSelectAge, onSelectCareer, onSeeResults, onBack,
}: {
  catStep: number;
  workSetting: string[];
  ageGroup: string;
  careerVision: string;
  onToggleWork: (v: string) => void;
  onContinueWork: () => void;
  onSelectAge: (v: string) => void;
  onSelectCareer: (v: string) => void;
  onSeeResults: () => void;
  onBack: () => void;
}) {
  const stepPct = ((catStep + 1) / 3) * 100;
  const stepLabel = `${catStep + 1} of 3`;

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <button className="bfs-ghost" onClick={onBack} aria-label="Back" style={{
          padding: "6px 12px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, color: C.textDim, cursor: "pointer",
          fontSize: 13, fontFamily: FONT, flexShrink: 0,
        }}>&larr; Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 7, borderRadius: 99, background: "#1b2336", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stepPct}%`, background: C.cyan, borderRadius: 99, transition: "width .35s ease", boxShadow: "0 0 12px rgba(34,211,238,.6)" }} />
          </div>
        </div>
        <span style={{ color: C.textDim, fontSize: 13, fontWeight: 500, flexShrink: 0, minWidth: 50, textAlign: "right" }}>
          {stepLabel}
        </span>
      </div>

      <div style={{ color: C.cyan, fontSize: 12.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "24px 0 6px" }}>
        Almost there
      </div>

      {catStep === 0 && (
        <div key="q41" className="bfs-fade">
          <h2 style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 600, margin: "0 0 4px" }}>
            Which work settings appeal to you most?
          </h2>
          <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 20px" }}>Select all that apply</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {WORK_OPTS.map((opt) => {
              const on = workSetting.includes(opt.value);
              return (
                <button key={opt.value} className="bfs-opt" onClick={() => onToggleWork(opt.value)} style={{
                  padding: "11px 16px", borderRadius: 12, cursor: "pointer",
                  fontFamily: FONT, fontSize: 14, fontWeight: on ? 600 : 400,
                  background: on ? C.cyanSoft : C.card, border: `1.5px solid ${on ? C.cyan : C.border}`,
                  color: on ? C.text : "#c3ccdb", boxShadow: on ? "0 0 14px rgba(34,211,238,.2)" : "none",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {on && <Check size={14} color={C.cyan} />}
                  {opt.label}
                </button>
              );
            })}
          </div>
          <button className="bfs-cta" onClick={onContinueWork} style={{
            marginTop: 26, width: "100%", padding: "15px", borderRadius: 12, border: "none", cursor: "pointer",
            background: C.cyan, color: "#04121a", fontSize: 15.5, fontWeight: 600, fontFamily: FONT,
            boxShadow: "0 0 22px rgba(34,211,238,.4)",
          }}>
            Continue &rarr;
          </button>
        </div>
      )}

      {catStep === 1 && (
        <div key="q42" className="bfs-fade">
          <h2 style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 600, margin: "0 0 20px" }}>
            Which patient age group do you prefer working with?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {AGE_OPTS.map((opt) => {
              const on = ageGroup === opt.value;
              return (
                <button key={opt.value} className="bfs-opt" onClick={() => onSelectAge(opt.value)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: 12, cursor: "pointer",
                  textAlign: "left", fontFamily: FONT, background: on ? C.cyanSoft : C.card,
                  border: `1.5px solid ${on ? C.cyan : C.border}`, boxShadow: on ? "0 0 18px rgba(34,211,238,.25)" : "none",
                }}>
                  <span style={{
                    width: 26, height: 26, flexShrink: 0, borderRadius: "50%",
                    background: on ? C.cyan : "#1b2336", border: `2px solid ${on ? C.cyan : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on && <Check size={13} color="#04121a" />}
                  </span>
                  <span style={{ fontSize: 15.5, color: on ? C.text : "#c3ccdb", fontWeight: on ? 600 : 400 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {catStep === 2 && (
        <div key="q43" className="bfs-fade">
          <h2 style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 600, margin: "0 0 20px" }}>
            What does your ideal long-term career look like?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CAREER_OPTS.map((opt) => {
              const on = careerVision === opt.value;
              return (
                <button key={opt.value} className="bfs-opt" onClick={() => onSelectCareer(opt.value)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: 12, cursor: "pointer",
                  textAlign: "left", fontFamily: FONT, background: on ? C.cyanSoft : C.card,
                  border: `1.5px solid ${on ? C.cyan : C.border}`, boxShadow: on ? "0 0 18px rgba(34,211,238,.25)" : "none",
                }}>
                  <span style={{
                    width: 26, height: 26, flexShrink: 0, borderRadius: "50%",
                    background: on ? C.cyan : "#1b2336", border: `2px solid ${on ? C.cyan : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on && <Check size={13} color="#04121a" />}
                  </span>
                  <span style={{ fontSize: 15.5, color: on ? C.text : "#c3ccdb", fontWeight: on ? 600 : 400 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <button className="bfs-cta" onClick={onSeeResults} disabled={!careerVision} style={{
            marginTop: 26, width: "100%", padding: "15px", borderRadius: 12, border: "none",
            cursor: careerVision ? "pointer" : "default",
            background: C.cyan, color: "#04121a", fontSize: 15.5, fontWeight: 600, fontFamily: FONT,
            boxShadow: "0 0 22px rgba(34,211,238,.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          }}>
            <Sparkles size={17} /> Continue &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Golden (Q44–Q45) ───────────────────────────────────────────────── */
function Golden({
  goldenStep, selectedBranch, wouldChooseAgain, workloadReality,
  onChooseAgain, onWorkload, onBack,
}: {
  goldenStep: number;
  selectedBranch: string;
  wouldChooseAgain: string;
  workloadReality: string;
  onChooseAgain: (v: string) => void;
  onWorkload: (v: string) => void;
  onBack: () => void;
}) {
  const stepPct = ((goldenStep + 1) / 2) * 100;

  const radioRow = (on: boolean): CSSProperties => ({
    display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: 12, cursor: "pointer",
    textAlign: "left", fontFamily: FONT, background: on ? C.cyanSoft : C.card,
    border: `1.5px solid ${on ? C.cyan : C.border}`, boxShadow: on ? "0 0 18px rgba(34,211,238,.25)" : "none",
  });

  const dot = (on: boolean): CSSProperties => ({
    width: 26, height: 26, flexShrink: 0, borderRadius: "50%",
    background: on ? C.cyan : "#1b2336", border: `2px solid ${on ? C.cyan : C.border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
  });

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
        <button className="bfs-ghost" onClick={onBack} aria-label="Back" style={{
          padding: "6px 12px", borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, color: C.textDim, cursor: "pointer",
          fontSize: 13, fontFamily: FONT, flexShrink: 0,
        }}>&larr; Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 7, borderRadius: 99, background: "#1b2336", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stepPct}%`, background: C.cyan, borderRadius: 99, transition: "width .35s ease", boxShadow: "0 0 12px rgba(34,211,238,.6)" }} />
          </div>
        </div>
        <span style={{ color: C.textDim, fontSize: 13, fontWeight: 500, flexShrink: 0, minWidth: 50, textAlign: "right" }}>
          {goldenStep + 1} of 2
        </span>
      </div>

      <div style={{ color: C.cyan, fontSize: 12.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "24px 0 6px" }}>
        Final questions
      </div>

      {goldenStep === 0 && (
        <div key="g1" className="bfs-fade">
          <h2 style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 600, margin: "0 0 20px" }}>
            If you could go back, would you choose {selectedBranch || "this branch"} again?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CHOOSE_AGAIN_OPTS.map((opt) => {
              const on = wouldChooseAgain === opt.value;
              return (
                <button key={opt.value} className="bfs-opt" onClick={() => onChooseAgain(opt.value)} style={radioRow(on)}>
                  <span style={dot(on)}>{on && <Check size={13} color="#04121a" />}</span>
                  <span style={{ fontSize: 15.5, color: on ? C.text : "#c3ccdb", fontWeight: on ? 600 : 400 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {goldenStep === 1 && (
        <div key="g2" className="bfs-fade">
          <h2 style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 600, margin: "0 0 20px" }}>
            How is the workload compared to what you expected?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {WORKLOAD_OPTS.map((opt) => {
              const on = workloadReality === opt.value;
              return (
                <button key={opt.value} className="bfs-opt" onClick={() => onWorkload(opt.value)} style={radioRow(on)}>
                  <span style={dot(on)}>{on && <Check size={13} color="#04121a" />}</span>
                  <span style={{ fontSize: 15.5, color: on ? C.text : "#c3ccdb", fontWeight: on ? 600 : 400 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Calculating ───────────────────────────────────────────────────── */
function Calculating() {
  const msgs = ["Scoring your 10 dimensions", "Matching against 20 specialties", "Ranking your strongest fits"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((p) => (p + 1) % msgs.length), 560); return () => clearInterval(t); }, []); // eslint-disable-line
  return (
    <div style={{ textAlign: "center", paddingTop: 150 }}>
      <div style={{ width: 56, height: 56, margin: "0 auto", borderRadius: "50%", border: "3px solid #1b2336", borderTopColor: C.cyan, animation: "bfsSpin .8s linear infinite", boxShadow: "0 0 24px rgba(34,211,238,.4)" }} />
      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 30 }}>Analyzing your responses</h2>
      <p style={{ color: C.cyan, fontSize: 14.5, marginTop: 8, animation: "bfsPulse 1.1s ease infinite" }}>{msgs[i]}&hellip;</p>
    </div>
  );
}

/* ─── Resident Results ───────────────────────────────────────────────── */
function ResidentResults({ data, selectedBranch, onRestart }: {
  data: BranchFitResponse; selectedBranch: string; onRestart: () => void;
}) {
  const top = data.top_matches[0];
  const radar = DIMENSIONS.map((d, i) => ({ dim: SHORT[i], value: Math.round(data.dimension_scores[d] * 10) / 10 }));

  const myBranchMatch = data.top_matches.find((m) => m.specialty === selectedBranch);
  const myScore = myBranchMatch?.fit_score ?? 0;

  let insightBg: string, insightBorder: string, insightText: string;
  if (myBranchMatch && myScore >= 60) {
    insightBg = "rgba(16,185,129,0.12)"; insightBorder = "#10b981";
    insightText = `You're a natural ${selectedBranch}! Your personality strongly matches what this branch demands.`;
  } else if (myBranchMatch && myScore >= 40) {
    insightBg = "rgba(245,158,11,0.12)"; insightBorder = "#f59e0b";
    insightText = `Interesting profile — you have a mixed fit for ${selectedBranch}. Your strongest natural match is ${top.specialty}.`;
  } else {
    insightBg = "rgba(34,211,238,0.12)"; insightBorder = "#22d3ee";
    insightText = `Your personality profile actually leans toward ${top.specialty}. This is completely normal — many residents discover this!`;
  }

  return (
    <div className="bfs-fade" style={{ paddingTop: 8 }}>
      {/* Insight box */}
      <div style={{
        marginBottom: 18, padding: "14px 16px", borderRadius: 12,
        background: insightBg, border: `1px solid ${insightBorder}`,
        color: C.text, fontSize: 14, lineHeight: 1.55,
      }}>
        {insightText}
      </div>

      <div style={{ textAlign: "center", color: C.textDim, fontSize: 13, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>
        Your strongest match
      </div>

      <div style={{
        marginTop: 14, padding: "26px 22px", borderRadius: 18, textAlign: "center",
        background: "linear-gradient(160deg, #15203a 0%, #0f1422 100%)", border: `1px solid ${C.borderStrong}`,
        boxShadow: "0 0 40px rgba(34,211,238,.12)",
      }}>
        <span style={{
          display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
          background: "rgba(56,189,248,.12)", color: TYPE_COLOR[top.type] ?? C.cyan, border: `1px solid ${(TYPE_COLOR[top.type] ?? C.cyan)}33`,
        }}>
          {top.type}
        </span>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "12px 0 0", letterSpacing: -0.4 }}>{top.specialty}</h1>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.cyan, marginTop: 6, lineHeight: 1, textShadow: "0 0 34px rgba(34,211,238,.5)" }}>
          {top.fit_score}<span style={{ fontSize: 26, fontWeight: 600 }}>%</span>
        </div>
        <div style={{ color: C.textDim, fontSize: 13.5, marginTop: 4 }}>fit score</div>
      </div>

      <div style={{ marginTop: 18, padding: "16px 8px 14px", borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 600, padding: "2px 12px 6px" }}>Your personality profile</div>
        <ResponsiveContainer width="100%" height={290}>
          <RadarChart data={radar} outerRadius="72%">
            <PolarGrid stroke="#243049" />
            <PolarAngleAxis dataKey="dim" tick={{ fill: C.textDim, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
            <Radar name="You" dataKey="value" stroke={C.cyan} fill={C.cyan} fillOpacity={0.3} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {top.matched_traits.length > 0 && (
        <Section title="Why this fits you">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {top.matched_traits.map((m) => (
              <span key={m} style={chip(C.good)}><Check size={13} /> {m}</span>
            ))}
          </div>
        </Section>
      )}

      {top.mismatched_traits.length > 0 && (
        <Section title="Worth knowing">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {top.mismatched_traits.map((m) => (
              <span key={m} style={chip(C.warn)}>{m} &mdash; may not match you</span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Your top 5 matches">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.top_matches.map((s, idx) => (
            <div key={s.specialty}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 14.5, fontWeight: idx === 0 ? 600 : 500, color: idx === 0 ? C.text : "#c3ccdb" }}>
                  <span style={{ color: C.textFaint, marginRight: 8 }}>{idx + 1}</span>{s.specialty}
                  <span style={{ marginLeft: 8, fontSize: 11.5, color: TYPE_COLOR[s.type] ?? C.textDim }}>{s.type}</span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.cyan }}>{s.fit_score}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "#1b2336", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.fit_score}%`, background: idx === 0 ? C.cyan : "#3a7a8c", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <p style={{ textAlign: "center", color: C.textDim, fontSize: 14, marginTop: 28, marginBottom: 4 }}>
        Thank you for contributing to Resilink&apos;s AI training! 🙏
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <GhostBtn onClick={() => {}}><Share2 size={16} /> Share result</GhostBtn>
        <GhostBtn onClick={onRestart}><RotateCcw size={16} /> Retake</GhostBtn>
      </div>
    </div>
  );
}

/* ─── Error ─────────────────────────────────────────────────────────── */
function ErrorScreen({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="bfs-fade" style={{ textAlign: "center", paddingTop: 130 }}>
      <div style={{ width: 56, height: 56, margin: "0 auto", borderRadius: "50%", background: "rgba(248,113,113,.12)", border: `1px solid ${C.danger}44`, display: "flex", alignItems: "center", justifyContent: "center", color: C.danger }}>
        <AlertTriangle size={26} />
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 600, marginTop: 24 }}>Something went wrong</h2>
      <p style={{ color: C.textDim, fontSize: 14.5, marginTop: 8, maxWidth: 380, marginInline: "auto", lineHeight: 1.55 }}>{msg}</p>
      <button className="bfs-cta" onClick={onRetry} style={{
        marginTop: 24, padding: "13px 30px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.cyan, color: "#04121a", fontSize: 15, fontWeight: 600, fontFamily: FONT,
        boxShadow: "0 0 22px rgba(34,211,238,.4)", display: "inline-flex", alignItems: "center", gap: 8,
      }}>
        <RotateCcw size={16} /> Try again
      </button>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
function chip(color: string): CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, fontSize: 13,
    background: `${color}14`, color, border: `1px solid ${color}33`,
  };
}
function GhostBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="bfs-ghost" onClick={onClick} style={{
      flex: 1, padding: "13px", borderRadius: 12, cursor: "pointer", fontFamily: FONT, fontSize: 14, fontWeight: 500,
      background: C.card, border: `1px solid ${C.border}`, color: C.textDim,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      {children}
    </button>
  );
}
