import { Heart, Brain, Lungs, Stomach, Bone, Stethoscope, Drop, Flower, Hand, Mind } from "../components/Icons";

// The names are what the server stores a consultation under and what it maps
// to a specialist profile (ml/consult/specialists.py), so keep them stable.
export const specialists = [
  { name: "General Physician", role: "General medicine", description: "Fever, infections and feeling generally unwell.", icon: Stethoscope },
  { name: "Heart Specialist", role: "Cardiology", description: "Chest discomfort, palpitations and blood pressure.", icon: Heart },
  { name: "Brain Specialist", role: "Neurology", description: "Headaches, dizziness, numbness or weakness.", icon: Brain },
  { name: "Lung Specialist", role: "Pulmonology", description: "Cough, wheeze and shortness of breath.", icon: Lungs },
  { name: "Stomach Specialist", role: "Digestive health", description: "Stomach pain, digestion and bowel problems.", icon: Stomach },
  { name: "Bone Specialist", role: "Orthopedics", description: "Joint, muscle and back pain, and injuries.", icon: Bone },
  { name: "Diabetes & Hormone Specialist", role: "Endocrinology", description: "Blood sugar, thirst, weight change and thyroid.", icon: Drop },
  { name: "Skin Specialist", role: "Dermatology", description: "Rashes, itching, moles and other skin changes.", icon: Hand },
  { name: "Allergy Specialist", role: "Allergy", description: "Reactions, hives, swelling and their triggers.", icon: Flower },
  { name: "Mental Health Specialist", role: "Mental health", description: "Mood, sleep, worry and stress.", icon: Mind },
];

export const findSpecialist = (name) => specialists.find((s) => s.name === name);
