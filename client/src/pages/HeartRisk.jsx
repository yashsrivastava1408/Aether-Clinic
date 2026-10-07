import React from "react";
import RiskAssessment from "../components/RiskAssessment";

const yesNo = [{ value: 1, label: "Yes" }, { value: 0, label: "No" }];

// In the order the heart model expects (ml/risk_models.py)
const fields = [
  { label: "Age", unit: "years", placeholder: "e.g. 54", min: 0 },
  { label: "Sex", options: [{ value: 1, label: "Male" }, { value: 0, label: "Female" }] },
  {
    label: "Chest pain type",
    options: [
      { value: 1, label: "Typical angina" },
      { value: 2, label: "Atypical angina" },
      { value: 3, label: "Non-anginal pain" },
      { value: 4, label: "No chest pain" },
    ],
  },
  { label: "Resting blood pressure", unit: "mm Hg", placeholder: "e.g. 130", min: 0, hint: "The upper (systolic) number." },
  { label: "Cholesterol", unit: "mg/dL", placeholder: "e.g. 240", min: 0 },
  { label: "Fasting blood sugar above 120 mg/dL", options: yesNo },
  {
    label: "Resting ECG",
    options: [
      { value: 0, label: "Normal" },
      { value: 1, label: "ST-T wave abnormality" },
      { value: 2, label: "Left ventricular hypertrophy" },
    ],
  },
  { label: "Maximum heart rate", unit: "beats per minute", placeholder: "e.g. 150", min: 0, hint: "The highest rate reached in an exercise test." },
  { label: "Chest pain during exercise", options: yesNo },
  { label: "ST depression (oldpeak)", placeholder: "e.g. 1.0", min: 0, step: "0.1", hint: "From an exercise ECG report. Use 0 if none." },
  {
    label: "Slope of the ST segment",
    options: [
      { value: 1, label: "Upsloping" },
      { value: 2, label: "Flat" },
      { value: 3, label: "Downsloping" },
    ],
  },
  {
    label: "Major vessels seen on fluoroscopy",
    options: [0, 1, 2, 3].map((n) => ({ value: n, label: String(n) })),
  },
  {
    label: "Thallium stress test",
    options: [
      { value: 3, label: "Normal" },
      { value: 6, label: "Fixed defect" },
      { value: 7, label: "Reversible defect" },
    ],
  },
];

export default function HeartRisk() {
  return (
    <RiskAssessment
      title="Heart disease risk"
      lead="Enter results from a heart check-up to get an estimate from a machine-learning model. Several of these values come from an ECG or stress-test report."
      endpoint="/api/ml/heart"
      fields={fields}
      specialist="Heart Specialist"
      dataNote="The model was trained on a small public heart-disease dataset of about 300 patients."
    />
  );
}
