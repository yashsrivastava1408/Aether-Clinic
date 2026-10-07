import React from "react";
import RiskAssessment from "../components/RiskAssessment";

// In the order the diabetes model expects (ml/risk_models.py)
const fields = [
  { label: "Pregnancies", placeholder: "e.g. 2", min: 0, step: "1", hint: "Number of pregnancies. Use 0 if none." },
  { label: "Glucose", unit: "mg/dL", placeholder: "e.g. 120", min: 0, hint: "Two hours into a glucose tolerance test." },
  { label: "Blood pressure", unit: "mm Hg", placeholder: "e.g. 72", min: 0, hint: "The lower (diastolic) number." },
  { label: "Skin fold thickness", unit: "mm", placeholder: "e.g. 29", min: 0, hint: "Measured at the back of the upper arm." },
  { label: "Insulin", unit: "mu U/mL", placeholder: "e.g. 140", min: 0, hint: "Two-hour serum insulin." },
  { label: "BMI", unit: "kg/m²", placeholder: "e.g. 32.4", min: 0, step: "0.1", hint: "Weight in kg divided by height in metres squared." },
  { label: "Diabetes pedigree score", placeholder: "e.g. 0.47", min: 0, step: "0.001", hint: "A family-history score, usually between 0.08 and 2.4." },
  { label: "Age", unit: "years", placeholder: "e.g. 33", min: 0, step: "1" },
];

export default function DiabetesRisk() {
  return (
    <RiskAssessment
      title="Diabetes risk"
      lead="Enter a few measurements to get an estimate from a machine-learning model."
      endpoint="/api/ml/diabetes"
      fields={fields}
      specialist="Diabetes & Hormone Specialist"
      dataNote="The model was trained on a public dataset of 768 women aged 21 and over, so it is less reliable for other groups."
    />
  );
}
