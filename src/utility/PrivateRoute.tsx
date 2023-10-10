import React, { useState, useEffect } from "react";
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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  //create a use effect to get updated window size when user resizes window
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []);


  return localStorage.getItem("papyrusai_access_token") && user ? (
    <>
      <Navigation />
      <div style={windowWidth >= 1024 ?
        { marginLeft: "17rem", width: "-webkit-fill-available", marginTop: "3rem" } :
        { marginLeft: 0, marginTop: "3rem" }
      }>
        <Outlet />
      </div>
    </>
  ) : (
    <Navigate to={"/login"} />
  );
}
