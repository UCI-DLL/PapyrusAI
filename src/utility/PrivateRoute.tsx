import React, { useContext, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navigation from "../features/navigation/Navigation";
import { UserType } from "./types/UserTypes";
import { AlertContext } from "./context/AlertContext";

/**
 * Show the appropriate screens if the user is logged in
 * @returns
 */

interface props {
  user: UserType | null;
}

const Alert = ({ severity, children }: { severity: string; children: React.ReactNode }) => {
  const bgColor = severity === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                  severity === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  severity === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                  'bg-blue-50 border-blue-200 text-blue-800';
  
  return (
    <div className={`border rounded-md p-4 mb-4 ${bgColor}`}>
      {children}
    </div>
  );
};

export function PrivateRoute({ user }: props): JSX.Element {
  const { alert, setAlert } = useContext(AlertContext);

  useEffect(() => {
    //When the page changes, reset the alert
    setAlert({ message: "", type: "info" });

    // eslint-disable-next-line
  }, [])

  return localStorage.getItem("papyrusai_access_token") ? (
    <Navigation>
      <div className="flex flex-col h-full">
        {alert.message !== "" && (
          <div className="p-4">
            <Alert severity={alert.type}>{alert.message}</Alert>
          </div>
        )}
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </div>
    </Navigation>
  ) : (
    <Navigate to={"/login"} />
  );
}
