import { createContext } from "react";

// Custom alert type to replace Material UI AlertColor
export type AlertType = "success" | "error" | "warning" | "info";

export const AlertContext = createContext<{
  alert: {message: string, type: AlertType}, 
  setAlert: (alert: {message: string, type: AlertType}) => void
} >({
  alert: { message: "", type: "info" },
  setAlert: () => {},
});