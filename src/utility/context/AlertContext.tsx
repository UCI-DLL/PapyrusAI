import { AlertColor } from "@mui/material";
import { createContext } from "react";

export const AlertContext = createContext<{
  alert: {message: string, type: AlertColor}, 
  setAlert: (alert: {message: string, type: AlertColor}) => void
} >({
  alert: { message: "", type: "info" },
  setAlert: () => {},
});