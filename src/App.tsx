import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/index.scss";
import {
  createTheme,
  CssBaseline,
  PaletteColor,
  ThemeProvider,
} from "@mui/material";
import { PrivateRoute } from "./utility/PrivateRoute";
import CacheBuster from "react-cache-buster";
import packageInfo from "../package.json";
import { UserContext } from "./utility/context/UserContext";
import Login from "./features/authentication/Login";
import Dashboard from "./features/dashboard/Dashboard";
import "./fonts/Montserrat/Montserrat-Regular.otf";
import "./fonts/OpenSans/OpenSans-Regular.ttf";
// import Registration from "./features/authentication/Registration";
// import ForgotPassword from "./features/authentication/ForgotPassword";
import Chat from "./features/chat/Chat";
import Reports from "./features/reports/Reports";
import Courses from "./features/course-groups/Courses";
import AddCourse from "./features/course-groups/AddCourse";
import Get from "./utility/Get";
import { getUserData } from "./utility/endpoints/UserEndpoints";
import { UserType } from "./utility/types/UserTypes";
import { Modal } from "./components/Modal";
import { Button } from "@mui/material";
import MissingUserInfoForm from "./features/dashboard/MissingUserInfoForm";
import Modules from "./features/modules/Modules";
import AddModule from "./features/modules/AddModule";
import ConversationList from "./features/conversations/ConversationList";
import EditCourse from "./features/course-groups/EditCourse";
import EditModule from "./features/modules/EditModule";
import Account from "./features/account/Account";

declare module "@mui/material/styles" {
  interface Palette {
    white: string;
  }
  interface PaletteOptions {
    white: PaletteColor;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    white: true;
  }
}

/* Material UI theme settings */
const { palette } = createTheme();
const theme = createTheme({
  palette: {
    background: {
      default: "#EBEBEB",
    },
    text: {
      primary: "#1a1a1a",
    },
    primary: { main: "#1b3d6d" },
    secondary: { main: "#6aa2b8" },
    error: { main: "#da0222" },
    white: palette.augmentColor({
      color: {
        main: "#fff",
      },
    }),
  },
  typography: {
    button: {
      textTransform: "none",
    },
    "fontFamily": "OpenSans",
  },
});

function App(): JSX.Element {
  // user object obtained from backend or local
  const [user, setUser] = useState<UserType | null>(
    localStorage.getItem("papyrusai_user")
      ? JSON.parse(localStorage.getItem("papyrusai_user") ?? "")
      : null
  ); //user info and not just sessionid
  const value = useMemo(() => ({ user, setUser }), [user, setUser]);
  const isProduction = process.env.NODE_ENV === "production";
  // only show if missing data
  const [showUpdateUserInfoModal, setShowUpdateUserInfoModal] = useState<boolean>(false);


  useEffect(() => {
    setTimeout(() => {
      // Check if we have an access token, if not, redirect to aws cognito login page
      if (!localStorage.getItem("papyrusai_access_token")) {
        window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "");
      } else {
        // get user's most update-to-date info
        //If access denied, then update the access token
        Get(getUserData()).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data) {
              //update our version of user
              setUser(res.data);
              localStorage.setItem("papyrusai_user", JSON.stringify(res.data));
            }
          } else {
            //remove user data
            localStorage.removeItem("papyrusai_access_token");
            localStorage.removeItem("papyrusai_user");
            setUser(null);
            window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "");
          }
        });
      }
    }, 300);
  }, []);

  //handle log out
  function handleLogOut() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <CacheBuster
      currentVersion={packageInfo.version}
      isEnabled={isProduction} //If false, the library is disabled.
      isVerboseMode={false} //If true, the library writes verbose logs to console.
      loadingComponent={<div>Loading...</div>} //If not pass, nothing appears at the time of new version check.
    >
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
        <UserContext.Provider value={value}>
          <Router>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Modal
                isOpen={showUpdateUserInfoModal}
                title={"We are missing some details"}
                onRequestClose={() => { }}
                hideClose={true}
                actions={
                  <Button sx={{ width: "100%" }} variant="contained" color="secondary" onClick={() => handleLogOut()}>
                    Log Out
                  </Button>
                }
              >
                <MissingUserInfoForm
                  user={user ? user : undefined}
                  closeForm={(user: UserType) => {
                    //Set user with new information
                    setUser(user);
                    localStorage.setItem("papyrusai_user", JSON.stringify(user));
                    //then close modal
                    setShowUpdateUserInfoModal(false);
                  }}
                />
              </Modal>
              <Routes>
                <Route
                  path="/login"
                  element={<Login setUser={(u) => setUser(u)} />}
                />
                {/* 
                <Route path="/register" element={<Registration setUser={(u) => setUser(u)} />} />
                <Route path="/forgot-password" element={<ForgotPassword setUser={(u) => setUser(u)} />} /> */}
                <Route path="*" element={<div>Page not found.</div>} />

                {/* Need to have start path here. Private route will redirect to login if no user  */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute
                      user={
                        user
                          ? user
                          : localStorage.getItem("papyrusai_user")
                            ? JSON.parse(
                              localStorage.getItem("papyrusai_user") ?? ""
                            )
                            : null
                      }
                    />
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                </Route>

                <Route path="/courses" element={<PrivateRoute user={user} />}>
                  <Route path="/courses" element={<Courses />} />
                </Route>

                <Route path="/modules" element={<PrivateRoute user={user} />}>
                  <Route path="/modules" element={<Modules />} />
                </Route>

                <Route path="/courses/:id/modules" element={<PrivateRoute user={user} />}>
                  <Route path="/courses/:id/modules" element={<Modules />} />
                </Route>

                <Route path="/courses/:id/modules/:id" element={<PrivateRoute user={user} />}>
                  <Route path="/courses/:id/modules/:id" element={<ConversationList />} />
                </Route>

                <Route path="/chat" element={<PrivateRoute user={user} />}>
                  <Route path="/chat" element={<Chat />} />
                </Route>

                <Route path="/account" element={<PrivateRoute user={user} />}>
                  <Route path="/account" element={<Account />} />
                </Route>

                {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
                  <>
                    <Route path="/createcourse" element={<PrivateRoute user={user} />}>
                      <Route path="/createcourse" element={<AddCourse />} />
                    </Route>

                    <Route path="/editcourse/:id" element={<PrivateRoute user={user} />}>
                      <Route path="/editcourse/:id" element={<EditCourse />} />
                    </Route>

                    <Route path="/courses/:id/createmodule" element={<PrivateRoute user={user} />}>
                      <Route path="/courses/:id/createmodule" element={<AddModule />} />
                    </Route>

                    <Route path="/editmodule/:id" element={<PrivateRoute user={user} />}>
                      <Route path="/editmodule/:id" element={<EditModule />} />
                    </Route>

                    <Route path="/reports" element={<PrivateRoute user={user} />}>
                      <Route path="/reports" element={<Reports />} />
                    </Route>
                  </>
                )}

              </Routes>
            </ThemeProvider>
          </Router>
        </UserContext.Provider>
      </div>
    </CacheBuster>
  );
}

export default App;
