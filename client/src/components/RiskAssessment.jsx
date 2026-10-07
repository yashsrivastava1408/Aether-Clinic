import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../utils/api";
import RiskGauge from "./RiskGauge";
import { ArrowRight, Spinner } from "./Icons";

const LEVEL_TEXT = {
  Low: "The model puts you in its low-risk group. Keep up routine check-ups.",
  Medium: "The model puts you in its medium-risk group. It is worth discussing these numbers with a doctor.",
  High: "The model puts you in its high-risk group. Please arrange to see a doctor about these numbers.",
};

/**
 * A form for one of the risk models and its result.
 *
 * `fields` are in the order the model expects them. A field with `options`
 * is a choice (the option value is the number the model was trained on);
 * any other field is a number.
 */
export default function RiskAssessment({ title, lead, endpoint, fields, specialist, dataNote }) {
  const [values, setValues] = useState(() => fields.map(() => ""));
  const [missing, setMissing] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  // On a phone the result is below the form, so bring it into view
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  const handleChange = (index, value) => {
    setValues((prev) => prev.map((v, i) => (i === index ? value : v)));
    setMissing((prev) => prev.filter((i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    const empty = values.map((v, i) => (v === "" || !Number.isFinite(Number(v)) ? i : -1)).filter((i) => i >= 0);
    setMissing(empty);
    if (empty.length > 0) {
      setError("Please fill in every field.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: values.map(Number) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.risk_percentage !== "number") {
        setError(res.status === 400 && data.error ? data.error : "The risk model is not available right now. Please try again shortly.");
        return;
      }
      setResult(data);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="mb-8">
        <h1 className="page-title">{title}</h1>
        <p className="page-lead">{lead}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <form onSubmit={submit} noValidate className="card p-6 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((field, i) => {
              const id = `risk-field-${i}`;
              const invalid = missing.includes(i);
              return (
                <div key={field.label}>
                  <label htmlFor={id} className="field-label">
                    {field.label}
                    {field.unit && <span className="ml-1 font-normal text-muted">({field.unit})</span>}
                  </label>
                  {field.options ? (
                    <select id={id} value={values[i]} onChange={(e) => handleChange(i, e.target.value)} aria-invalid={invalid} className={`input ${invalid ? "border-danger" : ""}`}>
                      <option value="">Select</option>
                      {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type="number"
                      inputMode="decimal"
                      step={field.step || "any"}
                      min={field.min}
                      value={values[i]}
                      onChange={(e) => handleChange(i, e.target.value)}
                      placeholder={field.placeholder}
                      aria-invalid={invalid}
                      className={`input ${invalid ? "border-danger" : ""}`}
                    />
                  )}
                  {field.hint && <p className="field-hint">{field.hint}</p>}
                </div>
              );
            })}
          </div>

          {error && <p className="notice notice-danger mt-6" role="alert">{error}</p>}

          <div className="mt-6 flex justify-end border-t border-line pt-6">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <><Spinner /> Calculating</> : "Estimate risk"}
            </button>
          </div>
        </form>

        <aside ref={resultRef} className="card scroll-mt-20 p-6 lg:sticky lg:top-24" aria-live="polite">
          <h2 className="text-base font-semibold text-ink">Result</h2>

          {result ? (
            <div className="fade-in mt-5 space-y-5">
              <div className="flex justify-center">
                <RiskGauge percentage={result.risk_percentage} level={result.risk_level} />
              </div>

              <p className="text-sm leading-relaxed text-ink">{LEVEL_TEXT[result.risk_level] || LEVEL_TEXT.Medium}</p>

              {result.warnings?.length > 0 && (
                <div className="notice notice-warn">
                  <p className="font-medium">Some values are outside what the model was trained on, so this estimate is less reliable:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
              )}

              <Link
                to={`/chatbot/${encodeURIComponent(specialist)}`}
                state={{ specializationName: specialist }}
                className="btn btn-secondary w-full"
              >
                Talk to the {specialist} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Fill in the form and choose Estimate risk. The result appears here.
            </p>
          )}

          <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            {dataNote} This is a statistical estimate, not a diagnosis.
          </p>
        </aside>
      </div>
    </div>
  );
}
