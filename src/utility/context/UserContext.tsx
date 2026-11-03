import { createContext } from "react";
import { UserType } from "../types/UserTypes";

export const UserContext = createContext<{
  user: UserType | null;
  setUser: (user: UserType | null) => void;
  isAdminPanelUser: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
}>({
  user: null,
  setUser: () => {},
  isAdminPanelUser: false,
  isAdmin: false,
  isInstructor: false,
});