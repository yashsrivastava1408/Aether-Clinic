import React from "react";

// --- Simple Specialist Icons ---
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
  </svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6.249a1 1 0 011.62-.78l5.38 6.271a1 1 0 010 1.56l-5.38 6.271A1 1 0 019 19z" transform="rotate(90 12 12)" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 8.5a2.5 2.5 0 115 0" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 8.5a2.5 2.5 0 115 0" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
  </svg>
);

const LungIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 15c-3-3-3-8 0-11s8-3 11 0c3 3 3 8 0 11l-5.5 5.5L6 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 15c3-3 3-8 0-11s-8-3-11 0c-3 3-3 8 0 11l5.5 5.5L18 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21V10" />
  </svg>
);

const StomachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6C6 6 3 9 3 13c0 4 3 7 9 7s9-3 9-7c0-4-3-7-9-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);

const BoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5c-1.104 0-2 .896-2 2v10c0 1.104.896 2 2 2h6c1.104 0 2-.896 2-2V7c0-1.104-.896-2-2-2H9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19a2 2 0 002 2h2a2 2 0 002-2" />
  </svg>
);

const specialists = [
  { name: "Cardiology", description: "Heart and blood vessel disorders.", icon: <HeartIcon />, color: "red-500" },
  { name: "Neuroscience", description: "Nervous system and brain health.", icon: <BrainIcon />, color: "blue-500" },
  { name: "Pulmonology", description: "Respiratory system and lung care.", icon: <LungIcon />, color: "cyan-500" },
  { name: "Gastroenterology", description: "Digestive system and its disorders.", icon: <StomachIcon />, color: "green-500" },
  { name: "Orthopedics", description: "Bones, joints, ligaments, and muscles.", icon: <BoneIcon />, color: "gray-500" },
];


export default function Consultation({ onSelectDoctor }) {   // ✅ accept the prop
  return (
    <section className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800">Choose a Specialist</h2>
        <p className="text-lg text-gray-600 mt-2">Select a domain to begin your AI-powered consultation.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {specialists.map((specialist) => (
          <div
            key={specialist.name}
            onClick={() => onSelectDoctor(specialist)}   // ✅ add click handler
            className={`bg-white rounded-xl shadow-lg border border-transparent hover:border-${specialist.color} hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-2 group`}
          >
            <div className={`p-6 flex items-center space-x-6 text-${specialist.color}`}>
              {specialist.icon}
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{specialist.name}</h3>
                <p className="text-gray-600">{specialist.description}</p>
              </div>
            </div>
            <div className={`w-full h-1 bg-${specialist.color} transition-all duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left`}></div>
          </div>
        ))}
      </div>
    </section>
  );
}