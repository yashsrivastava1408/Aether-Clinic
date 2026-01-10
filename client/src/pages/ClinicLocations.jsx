import React, { useState, useEffect } from 'react';
import NeuralBackground from '../components/NeuralBackground';
import { useTheme } from '../context/ThemeContext';

export default function ClinicLocations() {
    const [activeCity, setActiveCity] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [userLocation, setUserLocation] = useState({ x: 50, y: 55 }); // Initial center
    const [isLocating, setIsLocating] = useState(false);
    const { theme } = useTheme();

    // Simulate "Locate Me" functionality
    const handleLocateMe = () => {
        setIsLocating(true);
        setTimeout(() => {
            // Randomize location slightly to simulate real GPS
            setUserLocation({
                x: 40 + Math.random() * 20,
                y: 40 + Math.random() * 30
            });
            setIsLocating(false);
        }, 1500);
    };

    // Tier-1 City Hospital Data
    const clinics = [
        // Chennai
        { id: "CHN_01", name: "SRM Global Hospitals", city: "Chennai", type: "Private / Teaching", status: "ONLINE", x: 45, y: 72, specialties: ["Cardiology", "Orthopedics", "General"], capacity: 500, wait: "25 MIN", website: "https://www.srmist.edu.in/", emergency: false },
        { id: "CHN_02", name: "Apollo Hospitals (Greams Rd)", city: "Chennai", type: "Private (Flagship)", status: "BUSY", x: 46, y: 71, specialties: ["Multi-Specialty", "Heart", "Transplants"], capacity: 600, wait: "45 MIN", website: "https://www.apollohospitals.com/chennai/", emergency: true },

        // Bangalore
        { id: "BLR_01", name: "NIMHANS", city: "Bangalore", type: "Govt (Mental Health/Neuro)", status: "BUSY", x: 40, y: 70, specialties: ["Neurology", "Psychiatry", "Neurosurgery"], capacity: 900, wait: "120 MIN", website: "https://nimhans.ac.in/", emergency: true },
        { id: "BLR_02", name: "Manipal Hospitals", city: "Bangalore", type: "Private", status: "ONLINE", x: 41, y: 69, specialties: ["Oncology", "Cardiology", "IT-Assisted Care"], capacity: 400, wait: "15 MIN", website: "https://www.manipalhospitals.com/", emergency: false },

        // Mumbai
        { id: "MUM_01", name: "Tata Memorial Hospital", city: "Mumbai", type: "Govt (Cancer)", status: "CRITICAL_LOAD", x: 32, y: 55, specialties: ["Oncology", "Research", "Radiology"], capacity: 700, wait: "180 MIN", website: "https://tmc.gov.in/", emergency: false },
        { id: "MUM_02", name: "Lilavati Hospital", city: "Mumbai", type: "Private", status: "ONLINE", x: 31, y: 56, specialties: ["General", "Cardiac", "Neurology"], capacity: 350, wait: "30 MIN", website: "https://lilavatihospital.com/", emergency: true },

        // Delhi
        { id: "DEL_01", name: "AIIMS New Delhi", city: "Delhi", type: "Govt (Flagship)", status: "CRITICAL_LOAD", x: 38, y: 35, specialties: ["Multi-Specialty", "Research", "Trauma"], capacity: 2500, wait: "240 MIN", website: "https://www.aiims.edu/", emergency: true },
        { id: "DEL_02", name: "Fortis Escorts Heart Inst.", city: "Delhi", type: "Private", status: "ONLINE", x: 39, y: 36, specialties: ["Cardiology", "Pediatric Heart", "Surgery"], capacity: 310, wait: "20 MIN", website: "https://www.fortishealthcare.com/", emergency: true },

        // Hyderabad
        { id: "HYD_01", name: "Yashoda Hospitals", city: "Hyderabad", type: "Private", status: "ONLINE", x: 42, y: 60, specialties: ["Robotic Surgery", "Lung", "Heart"], capacity: 600, wait: "15 MIN", website: "https://www.yashodahospitals.com/", emergency: true },
        { id: "HYD_02", name: "Apollo Jubilee Hills", city: "Hyderabad", type: "Private", status: "BUSY", x: 41, y: 61, specialties: ["Emergency", "Neuro", "Critical Care"], capacity: 550, wait: "40 MIN", website: "https://hyderabad.apollohospitals.com/", emergency: true },

        // Kolkata
        { id: "CCU_01", name: "AMRI Hospitals", city: "Kolkata", type: "Private", status: "ONLINE", x: 65, y: 48, specialties: ["General", "Ortho", "Cardiac"], capacity: 400, wait: "35 MIN", website: "https://www.amrihospitals.in/", emergency: true },
        { id: "CCU_02", name: "Apollo Gleneagles", city: "Kolkata", type: "Private", status: "ONLINE", x: 66, y: 47, specialties: ["Oncology", "Neuro", "Gastrosciences"], capacity: 450, wait: "25 MIN", website: "https://kolkata.apollohospitals.com/", emergency: false },
    ];

    // Filtering & Sorting
    const filteredClinics = clinics
        .filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.city.toLowerCase().includes(searchTerm.toLowerCase());
            if (emergencyMode) return matchesSearch && c.emergency;
            return matchesSearch;
        })
        .sort((a, b) => {
            if (emergencyMode) {
                // Parse "25 MIN" -> 25 for sorting
                const waitA = parseInt(a.wait.split(' ')[0]);
                const waitB = parseInt(b.wait.split(' ')[0]);
                return waitA - waitB;
            }
            return 0; // Default order
        });

    // Dynamic Styles Logic
    const isDark = theme === 'dark';

    // Base Colors
    const bgColor = isDark ? 'bg-[#030303]' : 'bg-slate-50';
    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const mutedText = isDark ? 'text-gray-400' : 'text-slate-500';

    // Accents
    const accentColor = emergencyMode ? 'text-red-500' : 'text-emerald-500';
    const accentBg = emergencyMode ? 'bg-red-500' : 'bg-emerald-500';

    // Containers
    const cardBg = isDark ? 'bg-[#0a0a0a]/50' : 'bg-white';
    const cardBorder = emergencyMode
        ? 'border-red-500/40'
        : (isDark ? 'border-white/10' : 'border-slate-200');

    // Inputs
    const inputBg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
    const inputBorder = isDark ? 'border-white/10' : 'border-slate-200';
    const inputText = isDark ? 'text-white' : 'text-slate-900';

    return (
        <div className={`min-h-screen ${bgColor} ${textColor} relative overflow-hidden transition-colors duration-700 font-sans ${emergencyMode ? 'selection:bg-red-500/30' : 'selection:bg-emerald-500/30'}`}>
            <NeuralBackground />

            {/* Emergency Overlay Flash */}
            {emergencyMode && (
                <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none z-0" style={{ animationDuration: '2s' }} />
            )}

            {/* Floating Locate Me Button (Mobile) */}
            <div className="fixed bottom-24 right-6 z-50 md:hidden">
                <button
                    onClick={handleLocateMe}
                    className={`p-4 rounded-full shadow-2xl backdrop-blur-md border ${emergencyMode ? 'bg-red-600 border-red-400' : 'bg-emerald-600 border-emerald-400'} text-white transition-all transform hover:scale-110 active:scale-95`}
                >
                    <span className={`${isLocating ? 'animate-spin' : ''}`}>📍</span>
                </button>
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
                {/* Header Section with Toggle */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 animate-fadeIn">

                    {/* Title Area */}
                    <div className="text-center md:text-left">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 ${isDark ? 'bg-black/40' : 'bg-white/60'} ${emergencyMode ? 'border-red-500/50 text-red-500' : (isDark ? 'border-emerald-500/20 text-emerald-400 bg-emerald-900/20' : 'border-emerald-200 text-emerald-600 bg-emerald-50')}`}>
                            <span className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`}></span>
                            <span className="text-[10px] font-mono tracking-widest uppercase">
                                {emergencyMode ? '⚠️ EMERGENCY PROTOCOL: ACTIVE' : 'Global Grid // Sector: India'}
                            </span>
                        </div>
                        <h1 className={`text-4xl md:text-5xl font-bold bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-white via-gray-200 to-gray-500' : 'bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500'}`}>
                            Tier-1 Medical Network
                        </h1>
                    </div>

                    {/* Controls Group */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Location Simulation Button (Desktop) */}
                        <button
                            onClick={handleLocateMe}
                            disabled={isLocating}
                            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-mono ${isDark ? 'bg-black/20 hover:bg-white/5 border-white/10 hover:border-white/30 text-gray-300' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'} ${isLocating ? 'opacity-70' : ''}`}
                        >
                            {isLocating ? (
                                <>
                                    <span className="animate-spin">⏳</span> TRIANGULATING...
                                </>
                            ) : (
                                <>
                                    <span>📍</span> RE-CALIBRATE GPS
                                </>
                            )}
                        </button>

                        {/* Emergency Toggle Switch */}
                        <div
                            className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all cursor-pointer select-none group ${emergencyMode ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : (isDark ? 'bg-white/5 border-white/10 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-500/30 shadow-sm')}`}
                            onClick={() => {
                                setEmergencyMode(!emergencyMode);
                                setActiveCity(null);
                            }}
                        >
                            <div className="text-right">
                                <div className={`text-xs font-bold ${emergencyMode ? 'text-red-500' : (isDark ? 'text-gray-300' : 'text-slate-700')}`}>EMERGENCY MODE</div>
                                <div className={`text-[10px] font-mono tracking-wider ${mutedText}`}>{emergencyMode ? 'PRIORITY: CRITICAL' : 'STATUS: NORMAL'}</div>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${emergencyMode ? 'bg-red-500' : (isDark ? 'bg-gray-700' : 'bg-slate-300')}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${emergencyMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* Left: Map Visualization */}
                    <div className={`lg:col-span-2 relative h-[500px] border rounded-2xl overflow-hidden backdrop-blur-sm group animate-slideInLeft transition-colors duration-500 ${cardBg} ${cardBorder} ${emergencyMode ? 'shadow-[0_0_30px_rgba(239,68,68,0.1)]' : (isDark ? '' : 'shadow-xl shadow-slate-200/50')}`}>
                        {/* Grid Overlay */}
                        <div className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500 ${emergencyMode ? 'bg-[linear-gradient(rgba(239,68,68,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.1)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)]'}`} style={{ backgroundSize: '40px 40px' }} />

                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            {/* Abstract Holographic India Map */}
                            <div className="relative w-full h-full max-w-md">
                                <svg viewBox="0 0 100 100" className={`w-full h-full ${isDark ? 'drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'drop-shadow-lg'}`}>
                                    {/* Simplified India Outline Polygon (Stylized) */}
                                    <path
                                        d="M30,10 L45,10 L50,15 L60,15 L65,25 L75,25 L80,35 L75,45 L75,55 L65,60 L60,80 L50,95 L40,95 L35,80 L30,60 L25,50 L20,40 L30,25 L25,15 Z"
                                        fill="none"
                                        stroke={emergencyMode ? "rgba(239, 68, 68, 0.4)" : (isDark ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.6)")}
                                        strokeWidth="0.5"
                                        className="transition-colors duration-500"
                                    />

                                    {/* Route Animation Line */}
                                    {activeCity && (
                                        <>
                                            <defs>
                                                <filter id="glow">
                                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            {/* Static Path */}
                                            <path
                                                d={`M${userLocation.x},${userLocation.y} L${activeCity.x},${activeCity.y}`}
                                                stroke={emergencyMode ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"}
                                                strokeWidth="0.5"
                                                strokeDasharray="2,1"
                                            />
                                            {/* Animated Flow Packet */}
                                            <circle r="1.5" fill={emergencyMode ? "#ef4444" : "#10b981"} filter={isDark ? "url(#glow)" : ""}>
                                                <animateMotion
                                                    dur="1.5s"
                                                    repeatCount="indefinite"
                                                    path={`M${userLocation.x},${userLocation.y} L${activeCity.x},${activeCity.y}`}
                                                    calcMode="spline"
                                                    keySplines="0.4 0 0.2 1"
                                                    keyTimes="0;1"
                                                />
                                            </circle>
                                            {/* Connecting Line pulse */}
                                            <path
                                                d={`M${userLocation.x},${userLocation.y} L${activeCity.x},${activeCity.y}`}
                                                stroke={emergencyMode ? "rgba(239, 68, 68, 0.6)" : "rgba(16, 185, 129, 0.6)"}
                                                strokeWidth="0.2"
                                                strokeDasharray="5,5"
                                            >
                                                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite" />
                                            </path>

                                            {/* User Location Pulse */}
                                            <g className="transition-all duration-1000 ease-out" style={{ transformOrigin: `${userLocation.x}px ${userLocation.y}px` }}>
                                                <circle cx={userLocation.x} cy={userLocation.y} r="3" fill="none" stroke={emergencyMode ? "#ef4444" : (isDark ? "white" : "#64748b")} strokeWidth="0.2" className="animate-ping opacity-50" />
                                                <circle cx={userLocation.x} cy={userLocation.y} r="1" fill={emergencyMode ? "#ef4444" : (isDark ? "white" : "#475569")} />
                                                <text x={userLocation.x - 6} y={userLocation.y + 5} fontSize="2" fill={emergencyMode ? "#ef4444" : (isDark ? "white" : "#334155")} className="opacity-70 font-mono tracking-widest">{isLocating ? 'TRIANGULATING...' : 'USER NODE'}</text>
                                            </g>
                                        </>
                                    )}

                                    {/* Render Clinic Nodes */}
                                    {filteredClinics.map((clinic) => (
                                        <g
                                            key={clinic.id}
                                            className="cursor-pointer group/node transition-all duration-300"
                                            onClick={() => setActiveCity(clinic)}
                                            onMouseEnter={() => setActiveCity(clinic)}
                                            style={{ opacity: activeCity && activeCity.id !== clinic.id ? 0.3 : 1 }}
                                        >
                                            {/* Pulse Ring */}
                                            <circle cx={clinic.x} cy={clinic.y} r="3" fill={emergencyMode ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"} className="animate-ping opacity-75" />
                                            {/* Core Dot */}
                                            <circle
                                                cx={clinic.x}
                                                cy={clinic.y}
                                                r={activeCity?.id === clinic.id ? 2 : 1.5}
                                                fill={emergencyMode ? '#ef4444' : (clinic.status === 'ONLINE' ? '#10b981' : (clinic.status === 'BUSY' ? '#f59e0b' : '#ef4444'))}
                                                className="transition-all duration-300 shadow-[0_0_10px_currentColor]"
                                            />
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        </div>

                        {/* Radar Sweep Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent w-[50%] skew-x-12 animate-[scanLine_4s_linear_infinite] pointer-events-none opacity-20 ${emergencyMode ? 'via-red-500/20' : 'via-emerald-500/10'}`} />

                        {/* Map Info Box */}
                        <div className={`absolute bottom-4 left-4 p-2 border rounded backdrop-blur ${isDark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                            <div className={`text-[10px] font-mono ${accentColor}`}>
                                ZOOM: 100% | SECTOR: IN-TIER-1 | {emergencyMode ? '⚠️ FILTER: TRAUMA ONLY' : 'FILTER: ALL'}
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className={`absolute bottom-4 right-4 text-[9px] font-mono text-right max-w-[200px] ${mutedText}`}>
                            simulated data only.
                        </div>
                    </div>

                    {/* Right: Search & Details */}
                    <div className="lg:col-span-1 space-y-6 animate-slideInRight">

                        {/* Search Box */}
                        <div className={`relative group ${emergencyMode ? 'opacity-50 pointer-events-none' : ''}`}>
                            {/* Disabled look in emergency mode to emphasize auto-sort */}
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className={accentColor}>🔍</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Search Hospital or City..."
                                className={`w-full border rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-opacity-50 transition-all ${inputBg} ${inputBorder} ${inputText} ${emergencyMode ? 'focus:border-red-500' : 'focus:border-emerald-500'}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={emergencyMode}
                            />
                        </div>

                        {/* Active Node Details Panel */}
                        <div className={`border rounded-xl p-6 min-h-[300px] transition-colors duration-300 ${cardBg} ${activeCity && emergencyMode ? 'border-red-500/40 bg-red-900/10' : cardBorder}`}>
                            {activeCity ? (
                                <div className="space-y-4 animate-fadeIn">

                                    {/* Route Metrics (Only if selected) */}
                                    <div className={`mb-4 p-3 rounded border flex justify-between items-center ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                        <div>
                                            <div className={`text-[10px] uppercase ${mutedText}`}>Est. Travel Time</div>
                                            <div className={`text-xl font-mono ${textColor}`}>
                                                {isLocating ? <span className="animate-pulse">---</span> : Math.floor(14 + Math.random() * 20)}
                                                <span className="text-sm">min</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[10px] uppercase ${mutedText}`}>Traffic Cond.</div>
                                            <div className={`text-xs font-bold ${emergencyMode ? 'text-amber-500' : 'text-emerald-500'}`}>{emergencyMode ? 'CLEARED LANE' : 'MODERATE'}</div>
                                        </div>
                                    </div>

                                    <div className={`flex justify-between items-start border-b pb-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                        <div className="flex-1">
                                            <h3 className={`text-lg font-bold mb-1 leading-tight ${textColor}`}>{activeCity.name}</h3>
                                            <p className={`text-xs font-mono ${accentColor}`}>{activeCity.type}</p>
                                        </div>
                                        {/* Status Badge */}
                                        <div className={`ml-2 px-2 py-1 rounded text-[10px] font-bold border whitespace-nowrap ${activeCity.status === 'ONLINE' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                                                (activeCity.status === 'BUSY' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-red-500/10 border-red-500/30 text-red-500')
                                            }`}>
                                            {activeCity.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className={`p-3 rounded ${isDark ? 'bg-black/40' : 'bg-slate-50'}`}>
                                            <p className={`text-[10px] uppercase mb-1 ${mutedText}`}>Key Specialties</p>
                                            <div className="flex flex-wrap gap-1">
                                                {activeCity.specialties.map(spec => (
                                                    <span key={spec} className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'bg-white/5 text-gray-300 border-white/10' : 'bg-white text-slate-600 border-slate-200'}`}>{spec}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className={`p-3 rounded ${isDark ? 'bg-black/40' : 'bg-slate-50'}`}>
                                                <p className={`text-[10px] uppercase ${mutedText}`}>Est. Wait</p>
                                                <p className={`font-mono text-lg ${activeCity.wait.startsWith('1') || activeCity.wait.startsWith('2') ? 'text-amber-500' : 'text-emerald-500'}`}>{activeCity.wait}</p>
                                            </div>
                                            <div className={`p-3 rounded ${isDark ? 'bg-black/40' : 'bg-slate-50'}`}>
                                                <p className={`text-[10px] uppercase ${mutedText}`}>Capacity</p>
                                                <p className={`font-mono ${textColor}`}>{activeCity.capacity} BEDS</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => window.open(activeCity.website, '_blank')}
                                        className={`w-full mt-2 py-3 text-white text-sm font-semibold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 group ${emergencyMode ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'}`}
                                    >
                                        <span>VISIT OFFICIAL PORTAL</span>
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className={`h-full flex flex-col items-center justify-center space-y-3 opacity-50 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                    <div className={`text-4xl animate-pulse ${accentColor}`}>🏥</div>
                                    <p className="text-xs font-mono uppercase tracking-widest text-center">
                                        {emergencyMode ? 'Scanning for Trauma Centers...' : 'Select a hospital node from the map'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* List View */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredClinics.map((city, idx) => (
                                <div
                                    key={city.id}
                                    onClick={() => setActiveCity(city)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center animate-fadeIn ${activeCity?.id === city.id
                                        ? (emergencyMode ? 'bg-red-500/10 border-red-500/50' : (isDark ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-sm'))
                                        : (isDark ? 'bg-black/20 border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200')
                                        }`}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${emergencyMode && idx === 0 ? 'text-red-500' : textColor}`}>{city.name}</p>
                                        <p className={`text-[10px] ${mutedText}`}>{city.city} • <span className="font-mono">{emergencyMode ? `WAIT: ${city.wait}` : city.type.split(' ')[0]}</span></p>
                                    </div>
                                    <div className={`w-2 h-2 shrink-0 rounded-full ${city.status === 'ONLINE' ? 'bg-emerald-500' : (city.status === 'BUSY' ? 'bg-amber-500' : 'bg-red-500')}`} />
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
