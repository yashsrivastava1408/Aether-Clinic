import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../utils/api";
import RiskGauge from "./RiskGauge";
import { ArrowRight, Check, Spinner } from "./Icons";

const LEVEL_TEXT = {
  Low: "The model puts you in its low-risk group. Keep up routine check-ups.",
  Medium: "The model puts you in its medium-risk group. It is worth discussing these numbers with a doctor.",
  High: "The model puts you in its high-risk group. Please arrange to see a doctor about these numbers.",
};

const isFilled = (value) => value !== "" && Number.isFinite(Number(value));

/**
 * A form for one of the risk models and its result.
 *
 * `fields` are in the order the model expects them. A field with `options`
 * is a choice (the option value is the number the model was trained on);
 * any other field is a number. `group` puts a field under a heading on the
 * page without changing the order the values are sent in.
 */
export default function RiskAssessment({ title, lead, endpoint, fields, specialist, dataNote }) {
  const [values, setValues] = useState(() => fields.map(() => ""));
  const [missing, setMissing] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  // Fields under their headings, each remembering its place in the model's order
  const groups = useMemo(() => {
    const byName = new Map();
    fields.forEach((field, index) => {
      const name = field.group || "";
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push({ ...field, index });
    });
    return [...byName.entries()];
  }, [fields]);

  const filled = values.filter(isFilled).length;
  const progress = Math.round((filled / fields.length) * 100);

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
    const empty = values.map((v, i) => (isFilled(v) ? -1 : i)).filter((i) => i >= 0);
    setMissing(empty);
    if (empty.length > 0) {
      setError("Please fill in every field.");
      document.getElementById(`risk-field-${empty[0]}`)?.focus();
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

  const reset = () => {
    setValues(fields.map(() => ""));
    setMissing([]);
    setResult(null);
    setError("");
  };

  return (
    <div className="page">
      <header className="mb-8">
        <h1 className="page-title">{title}</h1>
        <p className="page-lead">{lead}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <form onSubmit={submit} noValidate className="card overflow-hidden lg:col-span-2">
          {/* How much of the form is filled in */}
          <div className="border-b border-line px-6 py-4">
            <div className="flex items-center justify-between text-xs font-medium text-muted">
              <span>{filled} of {fields.length} answered</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Form progress">
              <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="stagger divide-y divide-line">
            {groups.map(([name, groupFields], g) => (
              <div key={name || g} role="group" aria-label={name || undefined} className="px-6 py-6" style={{ "--i": g }}>
                {name && <h2 className="section-title mb-4">{name}</h2>}
                <div className="grid gap-5 sm:grid-cols-2">
                  {groupFields.map((field) => {
                    const id = `risk-field-${field.index}`;
                    const invalid = missing.includes(field.index);
                    const done = isFilled(values[field.index]);
                    return (
                      <div key={field.label}>
                        <label htmlFor={id} className="field-label flex items-center gap-1.5">
                          <span>
                            {field.label}
                            {field.unit && <span className="ml-1 font-normal text-muted">({field.unit})</span>}
                          </span>
                          {done && <Check className="fade-in h-3.5 w-3.5 text-ok" />}
                        </label>
                        {field.options ? (
                          <select id={id} value={values[field.index]} onChange={(e) => handleChange(field.index, e.target.value)} aria-invalid={invalid} className={`input ${invalid ? "border-danger" : ""}`}>
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
                            value={values[field.index]}
                            onChange={(e) => handleChange(field.index, e.target.value)}
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
              </div>
            ))}
          </div>

          <div className="border-t border-line bg-surface-2/50 px-6 py-4">
            {error && <p className="notice notice-danger fade-in mb-4" role="alert">{error}</p>}
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={reset} disabled={loading || (filled === 0 && !result)} className="btn btn-ghost">Clear</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? <><Spinner /> Calculating</> : <>Estimate risk <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </div>
        </form>

        <aside ref={resultRef} className="card scroll-mt-20 overflow-hidden lg:sticky lg:top-24" aria-live="polite">
          {loading && (
            <div className="h-1 overflow-hidden bg-surface-2"><div className="progress-indeterminate h-full w-1/3 rounded-full bg-brand" /></div>
          )}
          <div className="p-6">
            <h2 className="section-title">Result</h2>

            {result ? (
              <div className="stagger mt-5 space-y-5">
                <div className="flex justify-center" style={{ "--i": 0 }}>
                  <RiskGauge percentage={result.risk_percentage} level={result.risk_level} />
                </div>

                <p className="text-sm leading-relaxed text-ink" style={{ "--i": 2 }}>{LEVEL_TEXT[result.risk_level] || LEVEL_TEXT.Medium}</p>

                {result.warnings?.length > 0 && (
                  <div className="notice notice-warn" style={{ "--i": 3 }}>
                    <p className="font-medium">Some values are outside what the model was trained on, so this estimate is less reliable:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  </div>
                )}

                <Link
                  to={`/chatbot/${encodeURIComponent(specialist)}`}
                  state={{ specializationName: specialist }}
                  className="btn btn-secondary group w-full"
                  style={{ "--i": 4 }}
                >
                  Talk to the {specialist} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : loading ? (
              <div className="mt-5 flex flex-col items-center gap-4" aria-hidden="true">
                <div className="skeleton h-44 w-44 rounded-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center text-center">
                <div className="h-28 w-28 rounded-full border-[9px] border-dashed border-line" aria-hidden="true" />
                <p className="mt-4 text-sm leading-relaxed text-muted">Fill in the form and choose Estimate risk. The result appears here.</p>
              </div>
            )}

            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              {dataNote} This is a statistical estimate, not a diagnosis.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
