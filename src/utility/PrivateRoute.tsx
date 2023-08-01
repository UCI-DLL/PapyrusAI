import { Navigate, Outlet } from "react-router-dom";

/**
 * Show the appropriate screens if the user is logged in
 * @returns
 */

interface props {
  user: any | null; //TODO
}


export function PrivateRoute({ user }: props): JSX.Element {
  return user && user.pk ? (
    <>
      {/* <Navigation /> */}
      <Outlet />
    </>
  ) : (
    <Navigate to={"/login"} />
  );
}
