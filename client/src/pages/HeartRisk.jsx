import React, { useState } from "react";
import NeuralBackground from "../components/NeuralBackground";
import { useTheme } from "../context/ThemeContext";
import MLResultGauge from "../components/MLResultGauge";
import FactorImpact from "../components/FactorImpact";

export default function HeartRisk() {
  const [features, setFeatures] = useState(Array(13).fill(""));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const labels = [
    { label: "Age", placeholder: "Years", icon: "👤" },
    { label: "Sex", placeholder: "1 = Male, 0 = Female", icon: "⚧️" },
    { label: "Chest Pain Type", placeholder: "0-3 (Typical/Atypical/Non-anginal/Asymptomatic)", icon: "💔" },
    { label: "Resting BP", placeholder: "mm Hg", icon: "🩺" },
    { label: "Cholesterol", placeholder: "mg/dl", icon: "🍔" },
    { label: "Fasting Blood Sugar", placeholder: "1 = >120 mg/dl, 0 = <120", icon: "🍬" },
    { label: "Rest ECG", placeholder: "0-2 (Normal/ST-T/Hypertrophy)", icon: "📈" },
    { label: "Max Heart Rate", placeholder: "BPM", icon: "💓" },
    { label: "Exercise Induced Angina", placeholder: "1 = Yes, 0 = No", icon: "🏃" },
    { label: "Oldpeak", placeholder: "ST depression induced by exercise", icon: "📉" },
    { label: "Slope", placeholder: "0-2 (Upsloping/Flat/Downsloping)", icon: "📐" },
    { label: "CA", placeholder: "0-3 (Number of major vessels)", icon: "🩸" },
    { label: "Thal", placeholder: "1-3 (Normal/Fixed/Reversible)", icon: "🧬" }
  ];

  const handleChange = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const submit = async () => {
    setLoading(true);
    setResult(null); // Clear previous result for re-animation
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/ml/heart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: features.map(Number),
        }),
      });

      const data = await res.json();

      // Artificial delay for "Neural Sync" effect
      setTimeout(() => {
        setResult(data);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Analysis Failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#030303] text-white selection:bg-emerald-500/30 selection:text-emerald-200' : 'bg-slate-50 text-slate-900 selection:bg-emerald-200 selection:text-emerald-900'}`}>
      <NeuralBackground />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {/* Header Section */}
        <div className="mb-12 text-center relative">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 animate-fadeIn ${isDark ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-white border-emerald-200 shadow-sm'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className={`text-[10px] font-mono tracking-widest uppercase ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              System Active // Neural Link Established
            </span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-4 animate-slideInLeft ${isDark ? 'from-white via-emerald-100 to-emerald-400' : 'from-emerald-900 via-emerald-700 to-emerald-500'}`}>
            Cardiac Neural Analysis
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-slate-600'} max-w-2xl mx-auto text-lg animate-slideInRight delay-100`}>
            Advanced biometric scanning and risk assessment powered by deep learning algorithms. Enter patient vitals for immediate diagnostic prediction.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form Column */}
          <div className="lg:col-span-2 space-y-6 animate-fadeInUp delay-200">
            <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-2xl relative overflow-hidden group transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'}`}>
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-500/10'}`} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                {labels.map((item, i) => (
                  <div key={i} className="group/input relative">
                    <label className={`text-xs font-mono mb-1 block uppercase tracking-wider ml-1 ${isDark ? 'text-emerald-500/70' : 'text-slate-500'}`}>
                      {item.label}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-lg opacity-50 grayscale group-focus-within/input:grayscale-0 group-focus-within/input:opacity-100 transition-all duration-300">
                        {item.icon}
                      </span>
                      <input
                        type="number"
                        className={`w-full border rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none transition-all duration-300 ${isDark
                          ? 'bg-[#0a0a0a]/50 border-white/10 text-white placeholder-white/20 focus:border-emerald-500/50 focus:bg-emerald-900/10 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:shadow-md'}`}
                        placeholder={item.placeholder}
                        value={features[i]}
                        onChange={(e) => handleChange(i, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-8 pt-6 border-t flex justify-end ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <button
                  onClick={submit}
                  disabled={loading}
                  className="relative overflow-hidden group btn-shine px-8 py-3 rounded-lg bg-emerald-600 text-white font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ANALYZING BIOMETRICS...
                      </>
                    ) : (
                      <>
                        INITIATE DIAGNOSTIC LINK
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-1 animate-fadeInUp delay-300">
            {result ? (
              <div className={`h-full backdrop-blur-xl border rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-500 animate-slideInRight ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                {/* Dynamic Border Color based on result */}
                <div className={`absolute inset-0 border-2 rounded-2xl pointer-events-none ${result.prediction ? 'border-red-500/30' : 'border-emerald-500/30'}`} />

                <div className={`absolute inset-0 opacity-10 mix-blend-overlay ${result.prediction ? 'bg-red-600' : 'bg-emerald-600'}`} />

                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <span className="text-2xl">{result.prediction ? '⚠️' : '🛡️'}</span>
                  DIAGNOSTIC REPORT
                </h3>

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-center py-4">
                    <MLResultGauge
                      percentage={result.risk_percentage}
                      level={result.risk_level}
                      isDark={isDark}
                    />
                  </div>

                  <FactorImpact
                    features={features}
                    labels={labels}
                    results={result}
                    isDark={isDark}
                  />

                  <div className={`p-4 rounded-lg border text-sm leading-relaxed ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-200/80' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                    <strong className="text-blue-500 block mb-1">AI Recommendation:</strong>
                    {result.prediction
                      ? "Immediate medical consultation recommended. Neural patterns indicate high correlation with cardiovascular anomalies."
                      : "Vitals within nominal parameters. Routine monitoring advised to maintain optimal cardiac health."}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`h-full backdrop-blur-xl border rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 ${isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <span className="text-3xl grayscale opacity-30">📊</span>
                </div>
                <p className="text-sm font-mono uppercase tracking-widest">
                  Awaiting Input Data
                </p>
                <div className={`w-32 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                  <div className="w-1/2 h-full bg-emerald-500/20 animate-loading-dot mx-auto" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}