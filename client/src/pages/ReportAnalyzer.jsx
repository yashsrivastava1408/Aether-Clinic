import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../utils/api";
import { saveReportDigest } from "../utils/reportContext";
import CountUp from "../components/ui/CountUp";
import { ArrowRight, FileText, Spinner, Upload } from "../components/Icons";

const STATUS_STYLE = {
  low: "border-warn/30 bg-warn-soft text-warn",
  high: "border-danger/30 bg-danger-soft text-danger",
  normal: "border-ok/30 bg-ok-soft text-ok",
  unknown: "border-line bg-surface-2 text-muted",
};

const STEPS = ["Reading the text in the photo", "Checking each value against its range", "Writing the explanation"];

const formatRange = (test) => {
  const { range_low: low, range_high: high } = test;
  if (low != null && high != null) return `${low} – ${high}`;
  if (low != null) return `above ${low}`;
  if (high != null) return `below ${high}`;
  return "none available";
};

export default function ReportAnalyzer() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Opens a consultation with the specialist the report agent suggested,
  // with the out-of-range values ready in the message box.
  const discussWithSpecialist = () => {
    const { specialist, opening_message: openingMessage } = result.consult;
    navigate(`/chatbot/${encodeURIComponent(specialist)}`, {
      state: { specializationName: specialist, initialMessage: openingMessage },
    });
  };

  const chooseFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please choose a photo or screenshot (JPG or PNG). PDF files are not supported yet.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    chooseFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("report", file);

    try {
      const res = await api.post("/api/report/analyze", formData);
      setResult(res.data);
      saveReportDigest(res.data); // lets a later consultation take this report into account
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, "The report could not be analysed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const tests = result?.tests || [];
  const outOfRange = tests.filter((t) => t.status === "low" || t.status === "high").length;
  const stats = [
    { label: "Values found", value: tests.length, tone: "text-ink" },
    { label: "Out of range", value: outOfRange, tone: outOfRange > 0 ? "text-warn" : "text-ok" },
    { label: "In range", value: tests.filter((t) => t.status === "normal").length, tone: "text-ok" },
  ];

  return (
    <div className="page">
      <header className="mb-8">
        <h1 className="page-title">Lab report</h1>
        <p className="page-lead">
          Upload a photo of a lab report. Each value is checked against its reference range and explained in plain language.
          The report itself is not stored on the server.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* Upload */}
        <section className="card p-5 lg:sticky lg:top-24 lg:col-span-2">
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-all duration-300 ${dragging ? "scale-[1.01] border-brand bg-brand-soft" : "border-line hover:border-brand"} ${preview ? "p-3" : "px-6 py-14"}`}
          >
            {preview ? (
              <img src={preview} alt="The report you chose" className="fade-in max-h-96 w-full rounded-lg object-contain" />
            ) : (
              <>
                <span className={`icon-tile h-12 w-12 ${dragging ? "scale-110" : ""}`}><Upload /></span>
                <span className="mt-4 text-sm font-medium text-ink">{dragging ? "Drop the photo here" : "Drag a photo here, or click to choose"}</span>
                <span className="mt-1 text-xs text-muted">JPG or PNG. A sharp, well-lit photo of the results page works best.</span>
              </>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => chooseFile(e.target.files[0])} />
          </label>

          {file && <p className="mt-3 truncate text-xs text-muted">{file.name} · click the image to change it</p>}

          <button onClick={handleAnalyze} disabled={!file || loading} className="btn btn-primary mt-4 w-full">
            {loading ? <><Spinner /> Reading the report</> : "Analyse report"}
          </button>
        </section>

        {/* Result */}
        <section className="space-y-4 lg:col-span-3" aria-live="polite">
          {error && <p className="notice notice-danger fade-in" role="alert">{error}</p>}

          {loading && (
            <div className="card fade-in overflow-hidden">
              <div className="h-1 overflow-hidden bg-surface-2"><div className="progress-indeterminate h-full w-1/3 rounded-full bg-brand" /></div>
              <div className="p-6">
                <p className="text-sm font-semibold text-ink">Reading your report</p>
                <p className="mt-1 text-xs text-muted">This can take up to a minute.</p>
                <ul className="stagger mt-5 space-y-3">
                  {STEPS.map((step, i) => (
                    <li key={step} className="flex items-center gap-3 text-sm text-muted" style={{ "--i": i * 4 }}>
                      <span className="pulse-ring h-2 w-2 rounded-full bg-brand" /> {step}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 space-y-3" aria-hidden="true">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-5/6" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="card dot-grid flex flex-col items-center px-6 py-16 text-center text-muted">
              <FileText className="h-8 w-8" />
              <p className="mt-3 text-sm">Your results will appear here.</p>
            </div>
          )}

          {result && (
            <div className="stagger space-y-4">
              {tests.length > 0 && (
                <div className="grid grid-cols-3 gap-3" style={{ "--i": 0 }}>
                  {stats.map((stat) => (
                    <div key={stat.label} className="card px-4 py-4">
                      <p className={`text-2xl font-semibold ${stat.tone}`}><CountUp value={stat.value} /></p>
                      <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="card p-5" style={{ "--i": 1 }}>
                <h2 className="section-title">Summary</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink">{result.summary}</p>
              </div>

              {result.alerts?.length > 0 && (
                <div className="notice notice-warn" style={{ "--i": 2 }}>
                  <h2 className="font-semibold">Worth your attention</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {result.alerts.map((alert, i) => <li key={i}>{alert}</li>)}
                  </ul>
                </div>
              )}

              {result.consult && (
                <button onClick={discussWithSpecialist} className="btn btn-primary group w-full justify-between" style={{ "--i": 3 }}>
                  Discuss these results with the {result.consult.specialist}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}

              {tests.length > 0 ? (
                <div className="card overflow-hidden" style={{ "--i": 4 }}>
                  <h2 className="section-title border-b border-line px-5 py-3">Values found</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th scope="col" className="px-5 py-2 font-medium">Test</th>
                          <th scope="col" className="px-3 py-2 font-medium">Value</th>
                          <th scope="col" className="px-3 py-2 font-medium">Range</th>
                          <th scope="col" className="px-5 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tests.map((test, i) => (
                          <tr key={`${test.name}-${i}`} className="border-t border-line transition-colors hover:bg-surface-2/60">
                            <td className="px-5 py-2.5 font-medium text-ink">{test.name}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-ink">{test.value}{test.unit ? ` ${test.unit}` : ""}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted">{formatRange(test)}</td>
                            <td className="px-5 py-2.5">
                              <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[test.status] || STATUS_STYLE.unknown}`}>
                                {test.status === "unknown" ? "Not checked" : test.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : result.findings?.length > 0 && (
                <div className="card p-5" style={{ "--i": 4 }}>
                  <h2 className="section-title">Findings</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                    {result.findings.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div className="card p-5" style={{ "--i": 5 }}>
                  <h2 className="section-title">Suggested next steps</h2>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
                    {result.suggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}
                  </ol>
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted" style={{ "--i": 6 }}>
                Values are read from the photo automatically and can be misread. Check them against your report, and ask your doctor what they mean for you.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
