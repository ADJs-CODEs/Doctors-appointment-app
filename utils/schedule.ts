import { type Appointment, hoursBetweenDoses, type Medicine } from "../types";

/** "6_11_2026" + "02:30 PM" -> the visit's start in this phone's time. */
export function slotStart(a: Pick<Appointment, "slotDate" | "slotTime">): Date | null {
  const [d, m, y] = a.slotDate.split("_").map(Number);
  const t = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(a.slotTime.trim());
  if (!d || !m || !y || !t) return null;
  let h = Number(t[1]) % 12;
  if (t[3].toLowerCase() === "pm") h += 12;
  return new Date(y, m - 1, d, h, Number(t[2]));
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "18:45" */
export const clock = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** "Fri 6 Nov" */
export const shortDay = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Booked, paid for (or held for payment), and still ahead or happening. */
export const isOpen = (a: Appointment) => !a.cancelled && !a.isCompleted && !a.missed;

/** Held for payment and not paid yet: shows the countdown. */
export const unpaidHold = (a: Appointment, now = Date.now()) =>
  isOpen(a) && !a.payment && !!a.holdExpiresAt && new Date(a.holdExpiresAt).getTime() > now;

const HOUR = 3_600_000;

export type ActiveMedicine = {
  med: Medicine;
  appointment: Appointment;
  /** when the next dose is (or was) due */
  due: Date;
  /** more than an hour past due: a missed dose, shown as late */
  late: boolean;
  taken: Date[];
};

/**
 * Medicines still being taken, each with its next dose and the doses taken today. Same rules as
 * the server: an hour's grace after a dose is due, and a course left alone for longer than its
 * remaining doses would take counts as stopped, so it isn't shown as due.
 */
export function activeMedicines(appointments: Appointment[], now = new Date()): ActiveMedicine[] {
  return appointments
    .filter((a) => a.isCompleted && !a.cancelled)
    .flatMap((a) =>
      (a.healthData?.prescribedMedicines ?? [])
        .filter((m) => m.status !== "Completed" && m.remainingQuantity > 0)
        .flatMap((med): ActiveMedicine[] => {
          const gap = hoursBetweenDoses(med) * HOUR;
          const restOfCourse = med.remainingQuantity * gap + 24 * HOUR;
          let due: Date;
          if (med.lastTaken) {
            due = new Date(new Date(med.lastTaken).getTime() + gap);
          } else {
            const prescribed = slotStart(a);
            if (prescribed && now.getTime() - prescribed.getTime() > restOfCourse) return []; // never started
            due = now;
          }
          if (now.getTime() - due.getTime() > restOfCourse) return []; // stopped
          const taken = (med.adherenceLogs ?? []).map((t) => new Date(t)).filter((t) => sameDay(t, now));
          return [{ med, appointment: a, due, late: now.getTime() - due.getTime() > HOUR, taken }];
        }),
    );
}

/** "Mary Jane" from "MARY JANE" or "mary jane". */
export const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s|-)\S/g, (c) => c.toUpperCase());
