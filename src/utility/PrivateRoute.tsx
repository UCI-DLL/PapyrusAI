import React, { useContext, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navigation from "../features/navigation/Navigation";
import { UserType } from "./types/UserTypes";
import { AlertContext } from "./context/AlertContext";
import { Alert } from "@mui/material";

/**
 * Show the appropriate screens if the user is logged in
 * @returns
 */

interface props {
  user: UserType | null; 
}


export function PrivateRoute({ user }: props): JSX.Element {
  const { alert, setAlert } = useContext(AlertContext);

  useEffect(() => {
    //When the page changes, reset the alert
    // setAlert({message: "", type: "info"});
    setAlert({ message: "Notice: PapyrusAI will be down from March 21st through March 28th to transition the system to a new server. Due to this, conversations and courses will be lost (so make sure to download important conversations!). Your accounts will still be active, although you will need to reset your password after the transition.", type: "warning" });

    // eslint-disable-next-line
  }, [])

  return localStorage.getItem("papyrusai_access_token") && user ? (
    <>
      <Navigation />
      <div className="privateRoute">
        {alert.message !== "" ? (
          <Alert severity={alert.type}>{alert.message}</Alert>
        ): (
          <></>
        )}
        <Outlet />
      </div>
    </>
  ) : (
    <Navigate to={"/login"} />
  );
}
