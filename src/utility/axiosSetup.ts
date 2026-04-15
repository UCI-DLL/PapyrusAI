// src/api/axiosSetup.ts

import axios from "axios";

let isRedirecting = false;
let isInitialized = false;

export function setupAxiosInterceptors(onLogout: () => void) {
  // Prevent duplicate interceptors (VERY IMPORTANT in React)
  if (isInitialized) return;
  isInitialized = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log("error", error);
      if (error.response?.status === 401) {
        console.log("[auth] 401 detected");

        if (!isRedirecting) {
          isRedirecting = true;

          // Clear auth
          localStorage.removeItem("papyrusai_access_token");
          localStorage.removeItem("papyrusai_user");
          localStorage.removeItem("sessionId");

          // Update React state
          onLogout();

          // Redirect to Cognito
          window.location.replace(process.env.REACT_APP_LOGIN_URL || "");
        }
      }

      return Promise.reject(error);
    }
  );
}
