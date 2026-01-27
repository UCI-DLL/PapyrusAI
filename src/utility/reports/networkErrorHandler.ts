import React from "react";

// Helper function to check if error is a network error (ERR_NETWORK)
export const isNetworkError = (res: any): boolean => {
  return res?.code === "ERR_NETWORK";
};

// Helper function to handle 502 network errors on reports page
// Logs error, sets retryAttemptedRef to true, and retries after 500ms.
// If retryAttemptedRef is true, navigates back with error alert
export const createNetworkErrorHandler = (
  retryAttemptedRef: React.MutableRefObject<boolean>,
  setAlert: (alert: { message: string; type: "error" | "info" | "success" }) => void,
  navigator: any,
  t: (key: string) => string,
  setIsLoading: (loading: boolean) => void,
) => {
  return (res: any, retryFn: () => void) => {
    if (isNetworkError(res) && !retryAttemptedRef.current) {
      console.log("Network error (ERR_NETWORK) detected, attempting retry in 500ms", {
        error: res,
        timestamp: new Date().toISOString(),
      });
      retryAttemptedRef.current = true;
      setTimeout(() => {
        console.log("Retrying after network error...");
        retryFn();
      }, 500);
    } else if (isNetworkError(res) && retryAttemptedRef.current) {
      // Second network error, navigate back with error alert
      console.error("Network error retry failed, navigating back", {
        error: res,
        timestamp: new Date().toISOString(),
      });
      setAlert({
        message: t("errorMessage.networkError") || "Network error: Unable to load reports. Please try again later.",
        type: "error",
      });
      navigator(-1);
      setIsLoading(false);
    }
  };
};
