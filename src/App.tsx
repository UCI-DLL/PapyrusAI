import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/index.scss";
import {
  AlertColor,
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
import CreateCourse from "./features/course-groups/CreateCourse";
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
import AllModules from "./features/modules/AllModules";
import UserReports from "./features/reports/UserReports";
import { AlertContext } from "./utility/context/AlertContext";
import About from "./features/about/About";
import {
  changeTheme,
  getColorfulDarkTheme,
  getColorfulLightTheme,
  getDarkTheme,
  getLightTheme
} from "./utility/Themes";
import Library from "./features/library/Library";
import ViewFolder from "./features/library/ViewFolder";
import OldEditPrompt from "./features/prompts/EditPrompt";
import OldPrompts from "./features/prompts/Prompts";
import EditPrompt from "./features/library/EditPrompt";
import CreatePrompt from "./features/library/CreatePrompt";
import LoginError from "./features/authentication/LoginError";

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

function App(): JSX.Element {
  // user object obtained from backend or local
  const [user, setUser] = useState<UserType | null>(
    localStorage.getItem("papyrusai_user")
      ? JSON.parse(localStorage.getItem("papyrusai_user") ?? "")
      : null
  ); //user info and not just token
  const value = useMemo(() => ({ user, setUser }), [user, setUser]);
  const isProduction = process.env.NODE_ENV === "production";
  // only show if missing data
  const [showUpdateUserInfoModal, setShowUpdateUserInfoModal] = useState<boolean>(false);
  //alert pop up
  const [alert, setAlert] = useState<{ message: string, type: AlertColor }>({
    message: "",
    type: "info"
  });
  const alertValue = useMemo(() => ({ alert, setAlert }), [alert, setAlert]);

  useEffect(() => {
    const root = document.documentElement;
    if (user) {
      changeTheme(root, user["custom:theme"] ? user["custom:theme"] : "light");
    }
  }, [user])

  useEffect(() => {
    setTimeout(() => {
      // Check if we have an access token, if not, redirect to aws cognito login page
      if (!localStorage.getItem("papyrusai_access_token") && !user) {
        if (navigator.userAgent.indexOf("Chrome") < 0 && navigator.userAgent.indexOf("Safari") > -1) {
          //do nothing here if on safari (or it creates a weird loop)
        } else {
          // window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "");
        }
      } else {
        // get user's most update-to-date info
        //If access denied, then update the access token
        Get(getUserData()).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //update our version of user
              setUser(res.data);
              localStorage.setItem("papyrusai_user", JSON.stringify(res.data));
              //if user is missing name, then open the modal
              //NOTE: family_name optional (aka can be empty string)
              if (!res.data.name || !res.data.family_name || res.data.name === "") {
                setShowUpdateUserInfoModal(true);
              }
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
    }, 500);
  }, [showUpdateUserInfoModal]);

  //handle log out
  function handleLogOut() {
    localStorage.clear();
    setUser(null);
    window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "");
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
          <AlertContext.Provider value={alertValue}>
            <Router>
              <ThemeProvider
                theme={
                  (user &&
                    user["custom:theme"] === "colorful-dark") ?
                    getColorfulDarkTheme() :
                    (user && user["custom:theme"] === "dark") ?
                      getDarkTheme() :
                      (user && user["custom:theme"] === "colorful-light") ?
                        getColorfulLightTheme() :
                        getLightTheme()
                }
              >
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
                    closeForm={() => {
                      //Set user with new information
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
                  <Route
                    path="/login-error"
                    element={<LoginError />}
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
                    <Route path="/modules" element={<AllModules />} />
                  </Route>

                  <Route path="/courses/:id/modules" element={<PrivateRoute user={user} />}>
                    <Route path="/courses/:id/modules" element={<Modules />} />
                  </Route>

                  <Route path="/courses/:id/modules/:id" element={<PrivateRoute user={user} />}>
                    <Route path="/courses/:id/modules/:id" element={<ConversationList />} />
                  </Route>

                  <Route path="/chat/:id/:id/:id/:id" element={<PrivateRoute user={user} />}>
                    {/* username/courseid/moduleid/conversation index  */}
                    <Route path="/chat/:id/:id/:id/:id" element={<Chat />} />
                  </Route>

                  <Route path="/account" element={<PrivateRoute user={user} />}>
                    <Route path="/account" element={<Account />} />
                  </Route>

                  <Route path="/about" element={<PrivateRoute user={user} />}>
                    <Route path="/about" element={<About />} />
                  </Route>

                  {/* if the user has a group with "-TA" in it, then allow access  */}
                  {((user && user.groups && user.groups.find(a => a.includes("-TA"))) ||
                    user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors")) && (
                      <>
                        <Route path="/courses/:id/createmodule" element={<PrivateRoute user={user} />}>
                          <Route path="/courses/:id/createmodule" element={<AddModule />} />
                        </Route>

                        <Route path="/courses/:id/editmodule/:id" element={<PrivateRoute user={user} />}>
                          <Route path="/courses/:id/editmodule/:id" element={<EditModule />} />
                        </Route>

                        <Route path="/reports" element={<PrivateRoute user={user} />}>
                          <Route path="/reports" element={<Reports />} />
                        </Route>

                        <Route path="/reports/:id" element={<PrivateRoute user={user} />}>
                          <Route path="/reports/:id" element={<UserReports />} />
                        </Route>

                        {/* shows conversation list of other users  */}
                        <Route path="/courses/:id/modules/:id/username/:id" element={<PrivateRoute user={user} />}>
                          <Route path="/courses/:id/modules/:id/username/:id" element={<ConversationList />} />
                        </Route>
                      </>
                    )}

                  {user && user.groups && user.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
                    <>
                      <Route path="/createcourse" element={<PrivateRoute user={user} />}>
                        <Route path="/createcourse" element={<CreateCourse />} />
                      </Route>

                      <Route path="/editcourse/:id" element={<PrivateRoute user={user} />}>
                        <Route path="/editcourse/:id" element={<EditCourse />} />
                      </Route>

                      <Route path="/library" element={<PrivateRoute user={user} />}>
                        <Route path="/library" element={<Library />} />
                      </Route>

                      <Route path="/library/:id" element={<PrivateRoute user={user} />}>
                        <Route path="/library/:id" element={<ViewFolder />} />
                      </Route>

                      <Route path="/library/org/:id" element={<PrivateRoute user={user} />}>
                        <Route path="/library/org/:id" element={<ViewFolder />} />
                      </Route>

                      <Route path="/library/org/:id/createprompt" element={<PrivateRoute user={user} />}>
                        <Route path="/library/org/:id/createprompt" element={<CreatePrompt />} />
                      </Route>

                      <Route path="/library/org/:id/prompts/:id" element={<PrivateRoute user={user} />}>
                        <Route path="/library/org/:id/prompts/:id" element={<EditPrompt />} />
                      </Route>

                      <Route path="/library/:id/createprompt" element={<PrivateRoute user={user} />}>
                        <Route path="/library/:id/createprompt" element={<CreatePrompt />} />
                      </Route>

                      <Route path="/library/:id/prompts/:id" element={<PrivateRoute user={user} />}>
                        <Route path="/library/:id/prompts/:id" element={<EditPrompt />} />
                      </Route>
                    </>
                  )}
                  {/* hidden on nagivation  */}
                  {user && user.groups && user.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") && (
                    <>
                      <Route path="/prompts" element={<PrivateRoute user={user} />}>
                        <Route path="/prompts" element={<OldPrompts />} />
                      </Route>

                      <Route path="/prompts/:id" element={<PrivateRoute user={user} />}>
                        <Route path="/prompts/:id" element={<OldEditPrompt />} />
                      </Route>
                    </>
                  )}

                </Routes>
              </ThemeProvider>
            </Router>
          </AlertContext.Provider>
        </UserContext.Provider>
      </div>
    </CacheBuster>
  );
}

export default App;
