import { useState, useEffect } from "react";
import axios from "axios";
import ScanningHUD from "../components/ScanningHUD";
import BiometricPulse from "../components/BiometricPulse";
import NeuralSyncSequence from "../components/NeuralSyncSequence";

export default function ReportAnalyzer() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayedResult, setDisplayedResult] = useState(null);

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
      const res = await axios.post("http://localhost:5050/api/report/analyze", formData, {
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
    <div className="min-h-screen pt-12 pb-12 px-6 bg-[#0a0a0a] text-white relative">
      {/* Initial Splash Overhaul */}
      {pageLoading && (
        <NeuralSyncSequence onComplete={() => setPageLoading(false)} />
      )}

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            OPTICAL DIAGNOSTIC SCANNER V4.2
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-500 mb-4">
            Medical Report Analyzer
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Upload any medical document for instant AI-powered analysis of vitals, warnings, and health suggestions.
          </p>
        </div>

        {/* Main Interface Grid */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Left: Scanner / Input */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />

            <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">

              {/* TOP CONTROLS: Always visible */}
              <div className="p-4 bg-[#050505] border-b border-white/5 z-20">
                <button
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  className="w-full relative overflow-hidden group/btn bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
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
              <div className="relative h-[500px] border-b border-white/5 p-6">
                <ScanningHUD active={loading}>
                  {preview ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden border border-emerald-500/30 bg-black/20">
                      <img src={preview} alt="Scan Target" className="w-full h-full object-contain opacity-80" />
                      <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-20 pointer-events-none" />
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group/upload">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover/upload:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-gray-400 group-hover/upload:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <span className="text-gray-400 text-sm font-medium group-hover/upload:text-white">Upload Medical Report</span>
                      <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                  )}
                </ScanningHUD>
              </div>
            </div>
          </div>

          {/* Right: Analysis Results */}
          <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar relative">

            {/* DNA Helix Background (CSS-only replacement for missing SVG) */}
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
                  <BiometricPulse color="#10b981" speed="1s" />
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl text-gray-600">
                <div className="w-12 h-12 mb-4 opacity-20">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p>Waiting for data stream...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm font-mono flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            {displayedResult && (
              <div className="space-y-6 animate-fade-in-up relative z-10 glitch-reveal">

                {/* Summary Card */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Diagnostic Summary</h3>
                  <p className="text-gray-200 leading-relaxed font-light">{result.summary}</p>
                </div>

                {/* Grid for Lists */}
                <div className="grid gap-4">

                  {/* Alerts */}
                  {result.alerts?.length > 0 && (
                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <h4 className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase mb-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Critical Alerts
                      </h4>
                      <ul className="space-y-2">
                        {result.alerts.map((alert, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-200">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400" />
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Findings */}
                  <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <h4 className="text-blue-400 font-bold text-sm uppercase mb-3">Key Findings</h4>
                    <ul className="space-y-2">
                      {result.findings?.map((item, i) => (
                        <li key={i} className="text-sm text-gray-300 border-l-2 border-blue-500/30 pl-3">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <h4 className="text-emerald-400 font-bold text-sm uppercase mb-3">Recommended Actions</h4>
                    <ul className="space-y-3">
                      {result.suggestions?.map((sug, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold flex-shrink-0">
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