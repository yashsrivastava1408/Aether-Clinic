import { useState } from "react";
import { analyzeReport } from "../utils/reportApi";

export default function ReportAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a report first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await analyzeReport(file);
      setResult(res.data);
    } catch {
      setError("Failed to analyze report");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 🔑 THIS WRAPPER FIXES CSS
    <div className="container mx-auto px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          📄 Report Analyzer
        </h2>

        <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-600"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-6 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Report"}
        </button>

        {error && (
          <p className="mt-4 text-red-500 font-medium">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8 bg-slate-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">
              🧠 Analysis Result
            </h3>
            <pre className="text-sm whitespace-pre-wrap text-gray-700">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}