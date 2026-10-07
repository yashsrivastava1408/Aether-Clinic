import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/ui/Reveal";
import { useAuth } from "../context/AuthContext";
import { fetchMemory, isMemoryEnabled } from "../utils/healthMemory";
import { loadReportDigest } from "../utils/reportContext";
import { Alert, ArrowRight, Chat, Clock, Drop, FileText, Heart, Shield } from "../components/Icons";

const features = [
  {
    to: "/consultation",
    icon: Chat,
    title: "Talk through your symptoms",
    text: "Answer a few questions and get a short summary with possible causes, self-care and when to see a doctor.",
    action: "Start a consultation",
  },
  {
    to: "/report",
    icon: FileText,
    title: "Understand a lab report",
    text: "Upload a photo. Each value is checked against its reference range and explained in plain language.",
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
    text: "Enter measurements such as glucose and BMI and get an estimate from a machine-learning model.",
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

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

export default function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState(null); // null while loading, [] when there is nothing
  const reportDigest = loadReportDigest();
  const firstName = user && !user.isGuest ? user.name?.split(" ")[0] : "";

  useEffect(() => {
    fetchMemory().then((entries) => setRecent(entries.slice(-4).reverse())).catch(() => setRecent([]));
  }, []);

  return (
    <div className="page space-y-10">

      {/* Welcome panel */}
      <section className="card relative overflow-hidden">
        <div className="glow -right-16 -top-24 h-72 w-72 bg-brand/40" />
        <div className="glow -bottom-32 left-1/3 h-64 w-64 bg-brand/20" style={{ animationDelay: "-6s" }} />
        <div className="dot-grid absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />

        <div className="stagger relative px-6 py-10 sm:px-10 sm:py-14">
          <p className="badge" style={{ "--i": 0 }}>
            <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-brand" /> AI health assistant
          </p>
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl" style={{ "--i": 1 }}>
            {greeting()}{firstName ? `, ${firstName}` : ""}. What would you like to understand today?
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg" style={{ "--i": 2 }}>
            MedNexus asks about what you are feeling, explains lab results and estimates heart and diabetes risk.
            It helps you decide what care to seek. It does not replace a doctor.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row" style={{ "--i": 3 }}>
            <Link to="/consultation" className="btn btn-primary group px-6 py-3 text-base">
              Start a consultation <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/report" className="btn btn-secondary px-6 py-3 text-base">Read a lab report</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* What you can do */}
        <section className="xl:col-span-2">
          <h2 className="section-title">What you can do</h2>
          <div className="stagger mt-4 grid gap-4 sm:grid-cols-2">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.to} to={feature.to} className="card card-hover group flex flex-col p-6" style={{ "--i": i }}>
                  <span className="icon-tile"><Icon /></span>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{feature.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                    {feature.action} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Your activity */}
        <section>
          <h2 className="section-title">Your activity</h2>
          <div className="mt-4 space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock className="h-4 w-4 text-brand" /> Recent consultations
              </div>

              {recent === null && (
                <div className="mt-4 space-y-3" aria-hidden="true">
                  <div className="skeleton h-4 w-4/5" />
                  <div className="skeleton h-4 w-3/5" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              )}

              {recent?.length > 0 && (
                <ul className="stagger mt-3 divide-y divide-line">
                  {recent.map((entry, i) => (
                    <li key={i} className="py-2.5" style={{ "--i": i }}>
                      <p className="text-sm font-medium text-ink">{entry.complaint}</p>
                      <p className="mt-0.5 text-xs text-muted">{entry.specialist} · {entry.date}</p>
                    </li>
                  ))}
                </ul>
              )}

              {recent?.length === 0 && (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {isMemoryEnabled()
                    ? "Finished consultations will be listed here."
                    : "Health memory is off, so finished consultations are not kept."}
                </p>
              )}

              <Link to="/settings" className="mt-3 inline-block text-xs font-medium text-brand hover:underline">Manage health memory</Link>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FileText className="h-4 w-4 text-brand" /> Latest lab report
              </div>
              {reportDigest ? (
                <>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{reportDigest.split("\n")[0]}</p>
                  <p className="mt-2 text-xs text-muted">Kept in this browser and shared with your consultations.</p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted">No report analysed in this browser yet.</p>
              )}
              <Link to="/report" className="mt-3 inline-block text-xs font-medium text-brand hover:underline">
                {reportDigest ? "Analyse another report" : "Upload a report"}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* How a consultation works */}
      <Reveal as="section" className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">How a consultation works</h2>
        <ol className="mt-6 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={120 + i * 120} className="relative">
              {i < steps.length - 1 && (
                <span className="absolute left-10 right-0 top-4 hidden h-px bg-gradient-to-r from-brand/50 to-line md:block" aria-hidden="true" />
              )}
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink">{i + 1}</span>
              <h3 className="mt-3 text-base font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted md:pr-6">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </Reveal>

      {/* Safety */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal className="card p-6">
          <div className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Shield className="h-5 w-5 text-brand" /> Built to be careful
          </div>
          <ul className="mt-4 space-y-3">
            {safeguards.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={100} className="notice notice-warn flex gap-3 p-6">
          <Alert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="text-lg font-semibold">Not for emergencies</h2>
            <p className="mt-2 leading-relaxed">
              If you have chest pain, trouble breathing, sudden weakness, heavy bleeding or thoughts of harming yourself,
              call your local emergency number or go to the nearest hospital now.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
