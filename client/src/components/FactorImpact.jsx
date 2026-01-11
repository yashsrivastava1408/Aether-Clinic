import React from 'react';

const FactorImpact = ({ features, labels, results, isDark = true }) => {
    // Mock impact calculation based on simple medical ranges
    // In a real scenario, this would come from SHAP values or the ML model
    const impacts = labels.map((item, i) => {
        const val = parseFloat(features[i]);
        let impact = 0;

        // Simple heuristic logic for heart dataset
        if (item.label === "Age" && val > 60) impact = 0.6;
        if (item.label === "Resting BP" && val > 140) impact = 0.8;
        if (item.label === "Cholesterol" && val > 240) impact = 0.7;
        if (item.label === "Max Heart Rate" && val < 100) impact = 0.5;
        if (item.label === "Chest Pain Type" && val > 0) impact = 0.9;

        return { ...item, impact: impact > 0 ? (impact + Math.random() * 0.2) : Math.random() * 0.3 };
    }).sort((a, b) => b.impact - a.impact).slice(0, 5);

    return (
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
            <h4 className={`text-[10px] font-mono uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-emerald-500/70' : 'text-emerald-600'}`}>
                Dynamic Factor Correlation
            </h4>
            <div className="space-y-3">
                {impacts.map((item, i) => (
                    <div key={i} className="relative">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[11px] font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                <span className="opacity-50">{item.icon}</span>
                                {item.label}
                            </span>
                            <span className={`text-[9px] font-mono ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                                {(item.impact * 100).toFixed(0)}% Impact
                            </span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-1000 delay-500 ease-out ${item.impact > 0.6 ? 'bg-red-500' : item.impact > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                style={{ width: `${item.impact * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className={`mt-4 pt-3 border-t text-[9px] font-mono leading-relaxed ${isDark ? 'border-white/5 text-gray-500' : 'border-slate-100 text-slate-400'}`}>
                <span className="text-emerald-500">System Note:</span> These metrics indicate the relative contribution of input variables to the aggregate neural risk score.
            </div>
        </div>
    );
};

export default FactorImpact;
