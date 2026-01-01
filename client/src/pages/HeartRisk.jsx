import React, { useState } from "react";

export default function HeartRisk() {
  const [features, setFeatures] = useState(Array(13).fill(""));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const labels = [
    "Age",
    "Sex (1=Male, 0=Female)",
    "Chest Pain Type",
    "Resting BP",
    "Cholesterol",
    "Fasting Blood Sugar",
    "Rest ECG",
    "Max Heart Rate",
    "Exercise Induced Angina",
    "Oldpeak",
    "Slope",
    "CA",
    "Thal"
  ];

  const handleChange = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const submit = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5050/api/ml/heart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features: features.map(Number),
      }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">❤️ Heart Risk Assessment</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {labels.map((label, i) => (
          <input
            key={i}
            className="border p-2 rounded"
            placeholder={label}
            value={features[i]}
            onChange={(e) => handleChange(i, e.target.value)}
          />
        ))}
      </div>

      <button
        onClick={submit}
        className="mt-4 px-6 py-2 bg-red-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "Checking..." : "Check Risk"}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <p><strong>Prediction:</strong> {result.prediction ? "Disease Detected" : "No Disease"}</p>
          <p><strong>Risk %:</strong> {result.risk_percentage}%</p>
          <p><strong>Risk Level:</strong> {result.risk_level}</p>
        </div>
      )}
    </div>
  );
}