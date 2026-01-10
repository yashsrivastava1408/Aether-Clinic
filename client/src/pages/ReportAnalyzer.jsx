import { useState, useEffect } from "react";
import axios from "axios";
import ScanningHUD from "../components/ScanningHUD";
import BiometricPulse from "../components/BiometricPulse";
import NeuralSyncSequence from "../components/NeuralSyncSequence";
import { useTheme } from "../context/ThemeContext";

export default function ReportAnalyzer() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayedResult, setDisplayedResult] = useState(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Initial Page Loading
  useEffect(() => {
    // NeuralSyncSequence handles the transition internally via its progress
    // but we can also use a fallback timeout if needed.
  }, []);

  // Result Reconstruction Effect
  useEffect(() => {
    if (result && !displayedResult) {
      let timer = setTimeout(() => {
        setDisplayedResult(result);
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!result) setDisplayedResult(null);
  }, [result, displayedResult]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("report", file);

    try {
      // Direct call to match server route, bypassing utils for speed
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5050'}/api/report/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError("SCANNING FAILED. SYSTEM ERROR.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-12 pb-12 px-6 relative transition-colors duration-500 ${isDark ? 'bg-[#030303] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Initial Splash Overhaul */}
      {pageLoading && (
        <NeuralSyncSequence onComplete={() => setPageLoading(false)} />
      )}

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-emerald-500/50' : 'via-emerald-400/30'}`} />
        <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-400/10'}`} />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono mb-4 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white border-emerald-200 text-emerald-600 shadow-sm'}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OPTICAL DIAGNOSTIC SCANNER V4.2
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-800 mb-4 dark:from-white dark:via-emerald-100 dark:to-emerald-500">
            Medical Report Analyzer
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-slate-600'} max-w-xl mx-auto`}>
            Upload any medical document for instant AI-powered analysis of vitals, warnings, and health suggestions.
          </p>
        </div>

        {/* Main Interface Grid */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Left: Scanner / Input */}
          <div className="relative group">
            <div className={`absolute -inset-1 bg-gradient-to-r rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 ${isDark ? 'from-emerald-500/20 to-cyan-500/20' : 'from-emerald-300/40 to-cyan-300/40'}`} />

            <div className={`relative backdrop-blur-xl border rounded-2xl overflow-hidden flex flex-col ${isDark ? 'bg-black/50 border-white/10' : 'bg-white/80 border-slate-200 shadow-xl'}`}>

              {/* TOP CONTROLS: Always visible */}
              <div className={`p-4 border-b z-20 ${isDark ? 'bg-[#050505] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <button
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  className="w-full relative overflow-hidden group/btn bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <div className="relative z-10 flex items-center justify-center gap-2 text-sm">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>SCANNING...</span>
                      </>
                    ) : (
                      <>
                        <span>INITIATE SCAN SEQUENCE</span>
                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Scanner Window */}
              <div className={`relative h-[500px] border-b p-6 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <ScanningHUD active={loading}>
                  {preview ? (
                    <div className={`relative w-full h-full rounded-lg overflow-hidden border ${isDark ? 'border-emerald-500/30 bg-black/20' : 'border-emerald-200 bg-slate-50'}`}>
                      <img src={preview} alt="Scan Target" className="w-full h-full object-contain opacity-80" />
                      <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-20 pointer-events-none" />
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-xl cursor-pointer transition-all group/upload ${isDark ? 'border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover/upload:scale-110 transition-transform ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <svg className={`w-6 h-6 ${isDark ? 'text-gray-400 group-hover/upload:text-emerald-400' : 'text-slate-400 group-hover/upload:text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <span className={`${isDark ? 'text-gray-400 group-hover/upload:text-white' : 'text-slate-500 group-hover/upload:text-slate-800'} text-sm font-medium`}>Upload Medical Report</span>
                      <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </ScanningHUD>
              </div>
            </div>
          </div>

          {/* Right: Analysis Results */}
          <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar relative">

            {/* DNA Helix Background */}
            {loading && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden flex flex-col items-center">
                <div className="flex gap-4 animate-[marquee_20s_linear_infinite] opacity-50">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-10">
                      {Array.from({ length: 20 }).map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-20 scale-150">
                  <BiometricPulse color={isDark ? "#10b981" : "#059669"} speed="1s" />
                </div>
              </div>
            )}

            {!result && !error && (
              <div className={`h-full flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl ${isDark ? 'border-white/10 text-gray-600' : 'border-slate-300 text-slate-400'}`}>
                <div className="w-12 h-12 mb-4 opacity-20">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p>Waiting for data stream...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-mono flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            {displayedResult && (
              <div className="space-y-6 animate-fade-in-up relative z-10 glitch-reveal">

                {/* Summary Card */}
                <div className={`p-6 rounded-2xl border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-3">Diagnostic Summary</h3>
                  <p className={`leading-relaxed font-light ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{result.summary}</p>
                </div>

                {/* Grid for Lists */}
                <div className="grid gap-4">

                  {/* Alerts */}
                  {result.alerts?.length > 0 && (
                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <h4 className="flex items-center gap-2 text-red-500 font-bold text-sm uppercase mb-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Critical Alerts
                      </h4>
                      <ul className="space-y-2">
                        {result.alerts.map((alert, i) => (
                          <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400" />
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Findings */}
                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
                    <h4 className="text-blue-500 font-bold text-sm uppercase mb-3">Key Findings</h4>
                    <ul className="space-y-2">
                      {result.findings?.map((item, i) => (
                        <li key={i} className={`text-sm border-l-2 pl-3 ${isDark ? 'text-gray-300 border-blue-500/30' : 'text-slate-700 border-blue-300'}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
                    <h4 className="text-emerald-500 font-bold text-sm uppercase mb-3">Recommended Actions</h4>
                    <ul className="space-y-3">
                      {result.suggestions?.map((sug, i) => (
                        <li key={i} className={`flex items-start gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                            {i + 1}
                          </div>
                          {sug}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}