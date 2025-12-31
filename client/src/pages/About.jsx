import React from "react";

export default function About() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="bg-white rounded-lg shadow-xl p-10 md:p-16 max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-800 text-center mb-6">About Aether Clinic</h2>
        <p className="text-lg text-gray-600 leading-relaxed mb-4">
          Aether Clinic stands at the intersection of healthcare and artificial intelligence.
          We are a team of technologists, doctors, and innovators dedicated to making healthcare
          guidance more accessible, immediate, and understandable for everyone.
        </p>
      </div>
    </div>
  );
}