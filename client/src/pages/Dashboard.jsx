import React from "react";

export default function Dashboard({ navigate }) {
  return (
    <>
      {/* Hero Section */}
      <section className="text-center py-20 px-6 bg-gradient-to-b from-blue-100 to-slate-50">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-4 tracking-tight">
          Intelligent Healthcare, <span className="text-blue-600">Instantly</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Aether Clinic leverages advanced AI to provide preliminary consultations,
          symptom analysis, and health guidance right from your home.
        </p>
        <button
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg"
          onClick={() => navigate("consultation")}
        >
          Start Consultation
        </button>
      </section>

      {/* Section 1: How It Works (With Background Video) */}
      <section className="py-20 container mx-auto px-6 relative overflow-hidden bg-gray-800 rounded-xl my-16">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute left-0 w-full object-cover opacity-20 h-[140%] top-1/2 -translate-y-1/2"
        >
          <source src="/assets/section1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="relative text-center text-white p-8">
          <h2 className="text-4xl font-bold mb-4">A Simpler Path to Clarity</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Follow three simple steps to get the health insights you need.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">1. Choose a Specialist</h3>
              <p className="text-gray-300">
                Select the medical field that best matches your concern from our list of AI-powered specialists.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">2. Describe Your Symptoms</h3>
              <p className="text-gray-300">
                Engage in a guided conversation with our AI, answering questions to build a clear picture of your health.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">3. Receive Guidance</h3>
              <p className="text-gray-300">
                Get an AI-generated summary and potential next steps, helping you make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Technology */}
      <section className="py-20 container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Powered by Advanced AI</h2>
            <p className="text-lg text-gray-600 mb-4">
              Our platform utilizes state-of-the-art language models trained on vast, anonymized medical datasets.
              This allows our AI agents to understand context, ask relevant questions, and provide guidance that is both empathetic and informed.
            </p>
            <p className="text-lg text-gray-600">
              Security and privacy are paramount. All conversations are encrypted and your data is handled with the utmost confidentiality.
            </p>
          </div>
          <div className="md:w-1/2">
            <img
              src="/assets/section2.png"
              alt="AI Brain illustration"
              className="rounded-xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Section 3: CTA */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Take Control of Your Health?</h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Start a confidential and secure conversation with one of our AI specialists today.
          </p>
          <button
            className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition-transform transform hover:scale-105 shadow-lg"
            onClick={() => navigate("consultation")}
          >
            Begin Your Free Consultation
          </button>
        </div>
      </section>
    </>
  );
}