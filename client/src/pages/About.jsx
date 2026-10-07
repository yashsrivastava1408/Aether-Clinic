import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/ui/Reveal";
import { ArrowRight } from "../components/Icons";

const capabilities = [
  {
    title: "Symptom consultations",
    text: "A guided conversation with a specialist you choose. It screens for emergencies, asks follow-up questions, looks up clinical reference texts and ends with a short assessment that lists its sources.",
  },
  {
    title: "Lab report reading",
    text: "Values are read from a photo of the report, checked against reference ranges by fixed rules, and then explained in plain language.",
  },
  {
    title: "Risk estimates",
    text: "Two machine-learning models estimate heart disease and diabetes risk from measurements you enter.",
  },
  {
    title: "Follow-up and review",
    text: "Optional emailed check-ins after a consultation, a memory of past consultations you can switch off, and a queue where a clinician can approve assessments before release.",
  },
];

const stack = [
  { part: "Web app", tech: "React, Vite, Tailwind CSS" },
  { part: "API gateway", tech: "Node.js, Express, MongoDB" },
  { part: "Consultation engine", tech: "Python, Flask, LangGraph" },
  { part: "Knowledge search", tech: "Qdrant with combined keyword and meaning-based search" },
  { part: "Language models", tech: "A local model through Ollama, with Groq and Gemini as cloud options" },
  { part: "Risk models", tech: "scikit-learn ensembles trained on public datasets" },
];

const questions = [
  {
    q: "Does MedNexus replace my doctor?",
    a: "No. It gives general health information and helps you decide what kind of care to seek. It does not diagnose, prescribe or treat. Always talk to a qualified professional about medical decisions.",
  },
  {
    q: "How accurate are the risk models?",
    a: "They are trained on small public datasets: about 300 patients for heart disease and 768 women for diabetes. On held-out test data the heart model was right about 90% of the time and the diabetes model about 74%. Treat the result as a prompt to talk to a doctor, not as a diagnosis.",
  },
  {
    q: "What happens to my data?",
    a: "Consultation messages and the short summaries used as memory are encrypted before they are stored. Lab reports are analysed and not kept on the server. You can delete saved summaries in Settings.",
  },
  {
    q: "Can the AI be wrong?",
    a: "Yes. Language models can produce inaccurate information, and values read from a photo can be misread. Check anything important with a medical professional.",
  },
];

export default function About() {
  return (
    <div className="page-narrow">
      <h1 className="page-title">About MedNexus</h1>
      <p className="page-lead">
        MedNexus is an AI health assistant built as a portfolio project. It helps people understand symptoms and test results
        and decide what care to seek. It is not a medical service.
      </p>

      <Reveal as="section" className="mt-10">
        <h2 className="text-lg font-semibold text-ink">What it does</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {capabilities.map((item) => (
            <div key={item.title} className="card card-hover p-5">
              <h3 className="text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="mt-10">
        <h2 className="text-lg font-semibold text-ink">How it is built</h2>
        <dl className="card mt-4 divide-y divide-line">
          {stack.map((row) => (
            <div key={row.part} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:gap-6">
              <dt className="w-44 shrink-0 text-sm font-medium text-ink">{row.part}</dt>
              <dd className="text-sm text-muted">{row.tech}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal as="section" className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Common questions</h2>
        <div className="mt-4 space-y-3">
          {questions.map((item) => (
            <details key={item.q} className="card group px-5 py-4 transition-shadow open:shadow-raised">
              <summary className="flex list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
              </summary>
              <p className="fade-in mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Who built it</h2>
        <div className="card mt-4 flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand">YS</span>
          <div>
            <p className="font-semibold text-ink">Yash Srivastava</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              Designed and built MedNexus end to end: the web app, the API, the consultation engine and the risk models.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="mt-10">
        <Link to="/consultation" className="btn btn-primary">Start a consultation <ArrowRight /></Link>
      </div>
    </div>
  );
}
