"use client";

import { useState, useEffect, useCallback, type ReactNode, type CSSProperties } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Sparkles, RotateCcw, Share2, MessageCircle, Check, Activity, AlertTriangle,
} from "lucide-react";
import {
  fetchQuestions, submitAnswers,
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

type Screen = "landing" | "quiz" | "categorical" | "calculating" | "results" | "error";

/* ─── Main ──────────────────────────────────────────────────────────── */
export default function BranchFitScore() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(true);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [results, setResults] = useState<BranchFitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Categorical Q41–Q43 state
  const [catStep, setCatStep] = useState(0);
  const [workSetting, setWorkSetting] = useState<string[]>([]);
  const [ageGroup, setAgeGroup] = useState("");
  const [careerVision, setCareerVision] = useState("");

  const loadQuestions = useCallback(() => {
    setQLoading(true); setErrorMsg("");
    fetchQuestions()
      .then((qs) => { setQuestions(qs); setAnswers(Array(qs.length).fill(null)); setQLoading(false); })
      .catch((e: Error) => { setErrorMsg(e.message); setQLoading(false); setScreen("error"); });
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Submit answers when entering the calculating screen (with a minimum display time).
  useEffect(() => {
    if (screen !== "calculating") return;
    let active = true;
    const start = Date.now();
    submitAnswers(answers as number[], workSetting, ageGroup, careerVision)
      .then(async (res) => {
        const wait = Math.max(0, 1600 - (Date.now() - start));
        await new Promise((r) => setTimeout(r, wait));
        if (active) { setResults(res); setScreen("results"); }
      })
      .catch((e: Error) => { if (active) { setErrorMsg(e.message); setScreen("error"); } });
    return () => { active = false; };
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (val: number) => {
    const next = [...answers]; next[qi] = val; setAnswers(next);
    setTimeout(() => {
      if (qi < questions.length - 1) setQi(qi + 1);
      else setScreen("categorical");
    }, 180);
  };
  const back = () => { if (qi > 0) setQi(qi - 1); else setScreen("landing"); };
  const restart = () => {
    setAnswers(Array(questions.length).fill(null));
    setQi(0);
    setResults(null);
    setCatStep(0);
    setWorkSetting([]);
    setAgeGroup("");
    setCareerVision("");
    setScreen("landing");
  };

  // Categorical handlers
  const toggleWorkSetting = (val: string) =>
    setWorkSetting((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  const continueQ41 = () => setCatStep(1);
  const selectAgeGroup = (val: string) => { setAgeGroup(val); setTimeout(() => setCatStep(2), 180); };
  const selectCareerVision = (val: string) => setCareerVision(val);
  const seeResults = () => setScreen("calculating");

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
        {screen === "landing" && <Landing loading={qLoading} onStart={() => { setQi(0); setScreen("quiz"); }} />}
        {screen === "quiz" && questions[qi] && (
          <Quiz qi={qi} total={questions.length} q={questions[qi]} selected={answers[qi]} onAnswer={answer} onBack={back} />
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
            onSeeResults={seeResults}
          />
        )}
        {screen === "calculating" && <Calculating />}
        {screen === "results" && results && <Results data={results} onRestart={restart} />}
        {screen === "error" && (
          <ErrorScreen
            msg={errorMsg}
            onRetry={questions.length === 0 ? () => { setScreen("landing"); loadQuestions(); } : () => setScreen("calculating")}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Landing ───────────────────────────────────────────────────────── */
function Landing({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <div className="bfs-fade" style={{ textAlign: "center", paddingTop: 36 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 999,
        border: `1px solid ${C.border}`, background: C.cyanSoft, color: C.cyan, fontSize: 12.5, fontWeight: 500,
      }}>
        <Activity size={14} /> Resilink &middot; Branch Fit Score
      </div>

      <h1 style={{ fontSize: 34, lineHeight: 1.18, fontWeight: 700, margin: "26px 0 0", letterSpacing: -0.5 }}>
        Find your ideal<br />
        <span style={{ color: C.cyan, textShadow: "0 0 28px rgba(34,211,238,.45)" }}>medical specialty</span>
      </h1>

      <p style={{ color: C.textDim, fontSize: 15.5, lineHeight: 1.6, margin: "18px auto 0", maxWidth: 420 }}>
        A psychometric assessment that matches how you think and work against 20 specialties across 10 dimensions.
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", margin: "28px 0 0", flexWrap: "wrap" }}>
        {["40 questions", "~5 minutes", "No right answers"].map((c) => (
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
          : <><Sparkles size={18} /> Start assessment</>}
      </button>

      <p style={{ color: C.textFaint, fontSize: 12.5, marginTop: 22 }}>
        Be honest &mdash; there are no right or wrong answers.
      </p>
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
const WORK_OPTS = [
  { value: "or_procedures",    label: "Operating Room / Procedures" },
  { value: "icu_emergency",    label: "ICU / Emergency" },
  { value: "opd_clinic",       label: "OPD / Clinic" },
  { value: "lab_microscopy",   label: "Lab / Microscopy" },
  { value: "radiology_console", label: "Radiology Console / Reporting" },
  { value: "community",        label: "Community / Field work" },
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

function Categorical({
  catStep, workSetting, ageGroup, careerVision,
  onToggleWork, onContinueWork, onSelectAge, onSelectCareer, onSeeResults,
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
}) {
  const stepPct = ((catStep + 1) / 3) * 100;
  const stepLabel = `${catStep + 1} of 3`;

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
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
                <button
                  key={opt.value}
                  className="bfs-opt"
                  onClick={() => onToggleWork(opt.value)}
                  style={{
                    padding: "11px 16px", borderRadius: 12, cursor: "pointer",
                    fontFamily: FONT, fontSize: 14, fontWeight: on ? 600 : 400,
                    background: on ? C.cyanSoft : C.card,
                    border: `1.5px solid ${on ? C.cyan : C.border}`,
                    color: on ? C.text : "#c3ccdb",
                    boxShadow: on ? "0 0 14px rgba(34,211,238,.2)" : "none",
                    display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  {on && <Check size={14} color={C.cyan} />}
                  {opt.label}
                </button>
              );
            })}
          </div>
          <button
            className="bfs-cta"
            onClick={onContinueWork}
            style={{
              marginTop: 26, width: "100%", padding: "15px", borderRadius: 12, border: "none", cursor: "pointer",
              background: C.cyan, color: "#04121a", fontSize: 15.5, fontWeight: 600, fontFamily: FONT,
              boxShadow: "0 0 22px rgba(34,211,238,.4)",
            }}
          >
            Continue →
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
                <button
                  key={opt.value}
                  className="bfs-opt"
                  onClick={() => onSelectAge(opt.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: 12, cursor: "pointer",
                    textAlign: "left", fontFamily: FONT, background: on ? C.cyanSoft : C.card,
                    border: `1.5px solid ${on ? C.cyan : C.border}`,
                    boxShadow: on ? "0 0 18px rgba(34,211,238,.25)" : "none",
                  }}
                >
                  <span style={{
                    width: 26, height: 26, flexShrink: 0, borderRadius: "50%",
                    background: on ? C.cyan : "#1b2336",
                    border: `2px solid ${on ? C.cyan : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on && <Check size={13} color="#04121a" />}
                  </span>
                  <span style={{ fontSize: 15.5, color: on ? C.text : "#c3ccdb", fontWeight: on ? 600 : 400 }}>
                    {opt.label}
                  </span>
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
                <button
                  key={opt.value}
                  className="bfs-opt"
                  onClick={() => onSelectCareer(opt.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: 12, cursor: "pointer",
                    textAlign: "left", fontFamily: FONT, background: on ? C.cyanSoft : C.card,
                    border: `1.5px solid ${on ? C.cyan : C.border}`,
                    boxShadow: on ? "0 0 18px rgba(34,211,238,.25)" : "none",
                  }}
                >
                  <span style={{
                    width: 26, height: 26, flexShrink: 0, borderRadius: "50%",
                    background: on ? C.cyan : "#1b2336",
                    border: `2px solid ${on ? C.cyan : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on && <Check size={13} color="#04121a" />}
                  </span>
                  <span style={{ fontSize: 15.5, color: on ? C.text : "#c3ccdb", fontWeight: on ? 600 : 400 }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            className="bfs-cta"
            onClick={onSeeResults}
            disabled={!careerVision}
            style={{
              marginTop: 26, width: "100%", padding: "15px", borderRadius: 12, border: "none",
              cursor: careerVision ? "pointer" : "default",
              background: C.cyan, color: "#04121a", fontSize: 15.5, fontWeight: 600, fontFamily: FONT,
              boxShadow: "0 0 22px rgba(34,211,238,.4)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            }}
          >
            <Sparkles size={17} /> See my results
          </button>
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

/* ─── Results ───────────────────────────────────────────────────────── */
function Results({ data, onRestart }: { data: BranchFitResponse; onRestart: () => void }) {
  const top = data.top_matches[0];
  const radar = DIMENSIONS.map((d, i) => ({ dim: SHORT[i], value: Math.round(data.dimension_scores[d] * 10) / 10 }));

  return (
    <div className="bfs-fade" style={{ paddingTop: 8 }}>
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

      <button className="bfs-cta" style={{
        width: "100%", marginTop: 24, padding: "15px", borderRadius: 12, border: "none", cursor: "pointer",
        background: C.cyan, color: "#04121a", fontSize: 15.5, fontWeight: 600, fontFamily: FONT,
        boxShadow: "0 0 22px rgba(34,211,238,.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
      }}>
        <MessageCircle size={18} /> Talk to a {top.specialty} resident
      </button>

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
