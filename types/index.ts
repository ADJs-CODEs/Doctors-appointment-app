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
  /** unset = no video calls */
  videoFees?: number;
  address: { line1: string; line2: string };
}

export type VisitKind = "in-person" | "video";

/** A doctor's free times for one kind of visit (GET /api/availability/:docId). */
export interface Availability {
  available: boolean;
  offersInPerson: boolean;
  offersVideo: boolean;
  fees: number;
  videoFees: number | null;
  days: { slotDate: string; iso: string; weekday: number; slots: string[] }[];
}

export interface Medicine {
  name: string;
  /** "daily": dosagePerDay doses a day. "interval": one dose every dosagePerDay hours. */
  frequencyType?: "daily" | "interval";
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
  /** older appointments have none: they were clinic visits */
  kind?: VisitKind;
  paymentMethod?: "stripe" | "wallet";
  /** set while the time is only held for payment (30 min); an unpaid hold then disappears */
  holdExpiresAt?: string;
  /** a no-show: who didn't come */
  missed?: { by: "patient" | "doctor"; markedBy: string; at: string };
  refund?: { percent: number; amount: number; status: "refunded" | "manual" | "failed"; method?: "stripe" | "wallet" };
}

/** Hours between two doses (same rule as the website and the server). */
export const hoursBetweenDoses = (m: Pick<Medicine, "frequencyType" | "dosagePerDay">) => {
  const value = m.dosagePerDay > 0 ? m.dosagePerDay : 1;
  return m.frequencyType === "interval" ? value : 24 / value;
};

/** "3 times a day" or "every 8 hours". */
export const doseLabel = (m: Pick<Medicine, "frequencyType" | "dosagePerDay">) =>
  m.frequencyType === "interval"
    ? `Every ${m.dosagePerDay} hour${m.dosagePerDay === 1 ? "" : "s"}`
    : `${m.dosagePerDay}× a day`;

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
