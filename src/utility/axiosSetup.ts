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

        const requestUrl: string = error.config?.url ?? "";
        if (requestUrl.includes("data/log")) {
          return Promise.reject(error);
        }

        if (!isRedirecting) {
          isRedirecting = true;

          // Clear auth
          const isAdminPanelUser = localStorage.getItem("papyrusai_is_admin_panel_user") === "true";
          localStorage.removeItem("papyrusai_access_token");
          localStorage.removeItem("papyrusai_user");
          localStorage.removeItem("sessionId");
          localStorage.removeItem("papyrusai_is_admin_panel_user");

          // Update React state
          onLogout();

          // Redirect to the appropriate login page
          const loginUrl = isAdminPanelUser
            ? process.env.REACT_APP_ADMIN_PANEL_LOGIN_URL
            : process.env.REACT_APP_LOGIN_URL;
          window.location.replace(loginUrl || "");
        }
      }

      return Promise.reject(error);
    }
  );
}
