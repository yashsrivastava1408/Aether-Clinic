import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../utils/api";
import { saveReportDigest } from "../utils/reportContext";
import { ArrowRight, FileText, Spinner, Upload } from "../components/Icons";

const STATUS_STYLE = {
  low: "border-warn/30 bg-warn-soft text-warn",
  high: "border-danger/30 bg-danger-soft text-danger",
  normal: "border-ok/30 bg-ok-soft text-ok",
  unknown: "border-line bg-surface-2 text-muted",
};

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

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
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
        <section className="card p-5 lg:col-span-2">
          <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line text-center transition-colors hover:border-brand ${preview ? "p-3" : "px-6 py-12"}`}>
            {preview ? (
              <img src={preview} alt="The report you chose" className="max-h-96 w-full rounded-lg object-contain" />
            ) : (
              <>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand"><Upload /></span>
                <span className="mt-3 text-sm font-medium text-ink">Choose a photo of your report</span>
                <span className="mt-1 text-xs text-muted">JPG or PNG. A sharp, well-lit photo of the results page works best.</span>
              </>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
          </label>

          {file && <p className="mt-3 truncate text-xs text-muted">{file.name} · choose the image to change it</p>}

          <button onClick={handleAnalyze} disabled={!file || loading} className="btn btn-primary mt-4 w-full">
            {loading ? <><Spinner /> Reading the report</> : "Analyse report"}
          </button>
          {loading && <p className="mt-2 text-center text-xs text-muted">This can take up to a minute.</p>}
        </section>

        {/* Result */}
        <section className="space-y-4 lg:col-span-3" aria-live="polite">
          {error && <p className="notice notice-danger" role="alert">{error}</p>}

          {!result && !error && (
            <div className="card flex flex-col items-center px-6 py-14 text-center text-muted">
              <FileText className="h-8 w-8" />
              <p className="mt-3 text-sm">{loading ? "Reading the values in your report." : "Your results will appear here."}</p>
            </div>
          )}

          {result && (
            <div className="fade-in space-y-4">
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-ink">Summary</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink">{result.summary}</p>
              </div>

              {result.alerts?.length > 0 && (
                <div className="notice notice-warn">
                  <h2 className="font-semibold">Worth your attention</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {result.alerts.map((alert, i) => <li key={i}>{alert}</li>)}
                  </ul>
                </div>
              )}

              {result.consult && (
                <button onClick={discussWithSpecialist} className="btn btn-primary w-full justify-between">
                  Discuss these results with the {result.consult.specialist}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {tests.length > 0 ? (
                <div className="card overflow-hidden">
                  <h2 className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">Values found</h2>
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
                          <tr key={`${test.name}-${i}`} className="border-t border-line">
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
                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-ink">Findings</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
                    {result.findings.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-ink">Suggested next steps</h2>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink">
                    {result.suggestions.map((suggestion, i) => <li key={i}>{suggestion}</li>)}
                  </ol>
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted">
                Values are read from the photo automatically and can be misread. Check them against your report, and ask your doctor what they mean for you.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
