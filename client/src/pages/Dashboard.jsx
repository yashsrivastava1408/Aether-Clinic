import React, { useEffect, useState, useCallback } from "react";

// Optimized Floating Particles - Reduced count
const Particles = () => {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 20 + Math.random() * 10,
    size: 2 + Math.random() * 2,
  }));

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
};

// Typewriter Text Component
const TypewriterText = ({ text, delay = 0 }) => {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 1000);
        }
      }, 40);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [text, delay]);

  return (
    <span>
      {displayText}
      {showCursor && <span className="animate-pulse text-emerald-400">|</span>}
    </span>
  );
};

export default function Dashboard({ navigate }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Throttled parallax - only update every 50ms
  useEffect(() => {
    let throttleTimeout = null;

    const handleMouseMove = (e) => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        setMousePos({
          x: (e.clientX - window.innerWidth / 2) / 100,
          y: (e.clientY - window.innerHeight / 2) / 100,
        });
        throttleTimeout = null;
      }, 50);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, []);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden bg-[#030303]">
      {/* Hero Section - Professional Dark */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#0a0a0a] to-[#030303]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Subtle ambient glow with parallax - optimized blur */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
            willChange: 'transform',
          }}
        >
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[100px] bg-emerald-900/15" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[80px] bg-gray-800/20" />
        </div>

        {/* Particles */}
        <Particles />

        {/* Subtle ring decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
          <div className="absolute inset-0 border border-white/[0.03] rounded-full animate-spin-slow" />
          <div className="absolute inset-20 border border-emerald-500/[0.05] rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '40s' }} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.02] mb-12 animate-fade-in-up">
            <div className="relative">
              <span className="w-2 h-2 bg-emerald-500 rounded-full block" />
              <span className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm text-gray-400 font-medium tracking-wider uppercase">AI Healthcare Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 animate-fade-in-up stagger-1 tracking-tight leading-[1.1]">
            <span className="text-white">Intelligent</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Healthcare</span>
          </h1>

          {/* Typewriter Subheading */}
          <div className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-14 h-14 animate-fade-in-up stagger-2">
            <TypewriterText
              text="Advanced AI providing instant medical consultations and personalized health guidance."
              delay={500}
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3">
            <button
              className="group px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("consultation")}
            >
              <span className="flex items-center justify-center gap-3">
                Start Consultation
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            <button
              className="px-8 py-4 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/5 hover:border-white/20 transition-all duration-300"
              onClick={() => navigate("about")}
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-12 mt-24 max-w-2xl mx-auto animate-fade-in-up stagger-4">
            {[
              { value: "50K+", label: "Consultations" },
              { value: "98%", label: "Accuracy" },
              { value: "24/7", label: "Available" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-gray-600 text-sm mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-emerald-500/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section className="py-32 relative border-t border-white/5 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.15]"
        >
          <source src="/assets/section1.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay to maintain readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-transparent to-[#030303]" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 reveal">
              How It Works
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto reveal">
              Three steps to transform your healthcare experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Choose Specialist",
                desc: "Select from our range of AI specialists across various medical fields",
              },
              {
                num: "02",
                title: "Describe Symptoms",
                desc: "Engage in an intelligent conversation with our AI for accurate analysis",
              },
              {
                num: "03",
                title: "Get Guidance",
                desc: "Receive personalized recommendations and actionable next steps",
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`group border border-white/5 bg-[#030303]/80 backdrop-blur-sm rounded-2xl p-10 reveal stagger-${i + 1} hover:border-emerald-500/20 hover:bg-[#030303]/90 transition-all duration-500`}
              >
                <div className="text-6xl font-bold text-white/5 group-hover:text-emerald-500/10 transition-colors mb-6">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Technology */}
      <section className="py-32 relative bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 reveal-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] mb-8">
                <span className="text-emerald-500">⚡</span>
                <span className="text-sm text-gray-400 uppercase tracking-wider">Advanced Technology</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                Powered by
                <br />
                <span className="text-emerald-500">Advanced AI</span>
              </h2>

              <p className="text-lg text-gray-500 mb-10 leading-relaxed">
                Our platform harnesses state-of-the-art neural networks trained on extensive medical data,
                delivering insights with clinical-grade accuracy.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  { icon: "🔐", title: "256-bit encryption", desc: "Enterprise security" },
                  { icon: "🧬", title: "Deep learning models", desc: "50M+ records analyzed" },
                  { icon: "⚡", title: "Real-time inference", desc: "< 100ms response" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-5 p-5 border border-white/5 rounded-xl bg-white/[0.01] hover:border-emerald-500/20 transition-colors">
                    <div className="text-2xl">{feature.icon}</div>
                    <div>
                      <div className="text-white font-medium">{feature.title}</div>
                      <div className="text-gray-600 text-sm">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 reveal-right">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-emerald-900/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative border border-white/10 rounded-2xl p-2 bg-[#0a0a0a]">
                  <img
                    src="/assets/section2.png"
                    alt="AI Technology"
                    className="rounded-xl w-full"
                  />
                </div>

                {/* Status Badge */}
                <div className="absolute -bottom-4 -left-4 bg-[#0a0a0a] border border-white/10 px-5 py-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-white text-sm font-medium">System Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Features */}
      <section className="py-32 relative border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 reveal">
              Why Choose Us
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto reveal">
              Enterprise-grade healthcare solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🏥", title: "Multi-Specialty", desc: "10+ AI specialists" },
              { icon: "🛡️", title: "HIPAA Compliant", desc: "Certified secure" },
              { icon: "🌐", title: "24/7 Access", desc: "Always available" },
              { icon: "📊", title: "Analytics", desc: "Health insights" },
            ].map((feature, i) => (
              <div
                key={i}
                className={`text-center p-8 border border-white/5 rounded-2xl bg-white/[0.01] hover:border-emerald-500/20 transition-all duration-300 reveal stagger-${i + 1}`}
              >
                <div className="text-4xl mb-5">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: CTA */}
      <section className="py-32 relative bg-[#050505]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/10 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 reveal-scale">
            Ready to Get Started?
          </h2>

          <p className="text-xl text-gray-500 mb-12 max-w-xl mx-auto reveal">
            Join thousands who trust Aether Clinic for AI-powered healthcare.
          </p>

          <button
            className="group px-10 py-5 bg-emerald-600 text-white text-lg font-semibold rounded-lg hover:bg-emerald-500 transition-all duration-300 transform hover:-translate-y-1 reveal"
            onClick={() => navigate("consultation")}
          >
            <span className="flex items-center gap-3">
              Begin Free Consultation
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </button>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-10 reveal">
            {[
              { icon: "🛡️", text: "HIPAA Compliant" },
              { icon: "🔒", text: "256-bit Encryption" },
              { icon: "✓", text: "SOC 2 Certified" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-gray-600">
                <span>{item.icon}</span>
                <span className="text-sm uppercase tracking-wider">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <div className="text-xl font-semibold text-white mb-3">Aether Clinic</div>
          <p className="text-gray-600 text-sm">
            © 2026 Aether Clinic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}