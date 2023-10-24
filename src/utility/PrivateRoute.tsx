import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Navigation from "../features/navigation/Navigation";
import { UserType } from "./types/UserTypes";

/**
 * Show the appropriate screens if the user is logged in
 * @returns
 */

interface props {
  user: UserType | null; 
}


export function PrivateRoute({ user }: props): JSX.Element {

  return localStorage.getItem("papyrusai_access_token") && user ? (
    <>
      <Navigation />
      <div className="privateRoute">
        <Outlet />
      </div>
    </>
  ) : (
    <Navigate to={"/login"} />
  );
}
