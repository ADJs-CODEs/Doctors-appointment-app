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
  },
  CONNECTIONS: {
    REQUEST: "/api/connections/request",
    RESPOND: "/api/connections/respond",
    MY_REQUESTS: "/api/connections/my-requests",
    WATCHING_OVER: "/api/connections/watching-over",
    MY_WATCHERS: "/api/connections/my-watchers",
    REMOVE: "/api/connections/remove",
    PATIENT_DATA: (patientId: string) =>
      `/api/connections/patient/${patientId}`,
  },
  DOCTORS: {
    LIST: "/api/doctor/list",
  },
  CHAT: {
    MESSAGE: "/api/chat/message",
  },
};
export default function ApiPaths() {
  return null;
}
