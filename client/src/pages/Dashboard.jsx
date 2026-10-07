import React from "react";
import { Link } from "react-router-dom";
import { Alert, ArrowRight, Chat, Check, Drop, FileText, Heart } from "../components/Icons";

const features = [
  {
    to: "/consultation",
    icon: Chat,
    title: "Talk through your symptoms",
    text: "Choose a specialist and answer a few questions. You get a short summary with possible causes, self-care and when to see a doctor, with the sources it used.",
    action: "Start a consultation",
  },
  {
    to: "/report",
    icon: FileText,
    title: "Understand a lab report",
    text: "Upload a photo of your report. Each value is checked against its reference range and explained in plain language.",
    action: "Read a report",
  },
  {
    to: "/heart",
    icon: Heart,
    title: "Heart disease risk",
    text: "Enter results from a heart check-up and get an estimate from a machine-learning model.",
    action: "Check heart risk",
  },
  {
    to: "/diabetes",
    icon: Drop,
    title: "Diabetes risk",
    text: "Enter a few measurements such as glucose and BMI and get an estimate from a machine-learning model.",
    action: "Check diabetes risk",
  },
];

const steps = [
  { title: "Choose a specialist", text: "Pick the area closest to your problem. The conversation is handed over if it belongs elsewhere." },
  { title: "Answer a few questions", text: "The assistant asks about your symptoms and screens for signs of an emergency first." },
  { title: "Get a clear summary", text: "Possible causes, safe self-care, warning signs to watch for and what kind of doctor to see." },
];

const safeguards = [
  "Emergency symptoms are screened for before anything else.",
  "Answers are based on clinical reference texts and list their sources.",
  "Every reply passes a safety check before you see it.",
  "No diagnosis, no prescriptions and no medicine doses.",
];

export default function Dashboard() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="page py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="badge">AI health assistant</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              Understand your symptoms before you see a doctor.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              MedNexus asks about what you are feeling, explains your lab results and estimates heart and diabetes risk.
              It helps you decide what care to seek. It does not replace a doctor.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/consultation" className="btn btn-primary px-6 py-3 text-base">
                Start a consultation <ArrowRight />
              </Link>
              <Link to="/report" className="btn btn-secondary px-6 py-3 text-base">Read a lab report</Link>
            </div>
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="page">
        <h2 className="text-xl font-semibold tracking-tight text-ink">What you can do here</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.to} to={feature.to} className="card group flex flex-col p-6 transition-colors hover:border-brand">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{feature.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                  {feature.action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How a consultation works */}
      <section className="border-y border-line bg-surface">
        <div className="page">
          <h2 className="text-xl font-semibold tracking-tight text-ink">How a consultation works</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{i + 1}</span>
                <h3 className="mt-3 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety */}
      <section className="page">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Built to be careful</h2>
            <ul className="mt-4 space-y-3">
              {safeguards.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="notice notice-warn flex gap-3 p-6">
            <Alert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-lg font-semibold">Not for emergencies</h2>
              <p className="mt-2 leading-relaxed">
                If you have chest pain, trouble breathing, sudden weakness, heavy bleeding or thoughts of harming yourself,
                call your local emergency number or go to the nearest hospital now.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
