export const BASE_URL =
  "https://doctors-apointment-project-s-class.onrender.com";

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/user/login",
    REGISTER: "/api/user/register",
    FORGOT_PASSWORD: "/api/user/forgot-password",
    DOCTOR_LOGIN: "/api/doctor/login", // ADD THIS
  },
  USER: {
    GET_PROFILE: "/api/user/get-profile",
    UPDATE_PROFILE: "/api/user/update-profile",
    BOOK_APPOINTMENT: "/api/user/book-appointment",
    FETCH_APPOINTMENTS: "/api/user/appointments",
    CANCEL_APPOINTMENT: "/api/user/cancel-appointment",
    LOG_DOSE: "/api/user/update-dose",
    PAY_STRIPE: "/api/user/payment-stripe",
    PAYMENT_STATUS: "/api/user/payment-status",
    VIDEO_JOIN: (appointmentId: string) => `/api/user/video/${appointmentId}/join`,
  },
  WALLET: {
    OVERVIEW: "/api/wallet",
    PAY_APPOINTMENT: "/api/wallet/pay-appointment",
  },
  AVAILABILITY: (docId: string, kind: "in-person" | "video") => `/api/availability/${docId}?kind=${kind}`,
  DOCTOR: {
    VIDEO_JOIN: (appointmentId: string) => `/api/doctor/video/${appointmentId}/join`,
  },
  CONNECTIONS: {
    REQUEST: "/api/connections/request",
    RESPOND: "/api/connections/respond",
    MY_REQUESTS: "/api/connections/my-requests",
    WATCHING_OVER: "/api/connections/watching-over",
    MY_WATCHERS: "/api/connections/my-watchers",
    REMOVE: "/api/connections/remove",
    NUDGE: "/api/connections/nudge",
    PATIENT_DATA: (patientId: string) =>
      `/api/connections/patient/${patientId}`,
  },
  DOCTORS: {
    LIST: "/api/doctor/list",
  },
  CHAT: {
    MESSAGE: "/api/chat/message",
  },
  // chat with your doctors (the assistant above is CHAT)
  MESSAGES: {
    LIST: "/api/user/messages",
    UNREAD: "/api/user/messages/unread",
    THREAD: (docId: string) => `/api/user/messages/${docId}`,
    READ: (docId: string) => `/api/user/messages/${docId}/read`,
  },
  SHOP: {
    BROWSE: "/api/shop/browse",
  },
  WISH_WELL: {
    ALL: "/api/wish-well/all",
    SEND: "/api/wish-well/send-emoji",
    PENDING: "/api/wish-well/pending-consent",
    CONSENT: "/api/wish-well/consent",
  },
};
export default function ApiPaths() {
  return null;
}
