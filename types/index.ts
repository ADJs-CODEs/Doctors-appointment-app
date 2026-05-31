export interface User {
  _id: string;
  name: string;
  email: string;
  image: string;
  phone: string;
  dob: string;
  gender: string;
  address: { line1: string; line2: string };
}

export interface Doctor {
  _id: string;
  name: string;
  image: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  fees: number;
  address: { line1: string; line2: string };
}

export interface Medicine {
  name: string;
  dosagePerDay: number;
  totalQuantity: number;
  remainingQuantity: number;
  lastTaken?: string;
  overdoseAlert?: boolean;
  adherenceLogs?: string[];
  status: "Active" | "Completed";
}

export interface HealthData {
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  prescribedMedicines: Medicine[];
  doctorNotes?: string;
}

export interface Appointment {
  _id: string;
  userId: string;
  docId: string;
  docData: Doctor;
  userData: User;
  slotDate: string;
  slotTime: string;
  amount: number;
  date: number;
  cancelled: boolean;
  payment: boolean;
  isCompleted: boolean;
  healthData?: HealthData;
  patientStatus?: "Stable" | "Critical" | "Completed";
  messages?: { content: string; sentAt: string; isCritical: boolean }[];
}

export interface Connection {
  _id: string;
  requesterId: string;
  patientId: string;
  status: "pending" | "accepted" | "rejected";
  patient?: User;
  watcher?: User;
  requester?: User;
}
export default function Types() {
  return null;
}
