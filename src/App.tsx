import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/index.scss";
import { AlertType } from "./utility/context/AlertContext";
import { PrivateRoute } from "./utility/PrivateRoute";
import CacheBuster from "react-cache-buster";
import packageInfo from "../package.json";
import { UserContext } from "./utility/context/UserContext";
import Login from "./features/authentication/Login";
import Dashboard from "./features/dashboard/Dashboard";
import "./fonts/Montserrat/Montserrat-Regular.otf";
import "./fonts/OpenSans/OpenSans-Regular.ttf";
import Chat from "./features/chat/Chat";
import ChatLayout from "./features/chat/ChatLayout";
import Reports from "./features/reports/Reports";
import Courses from "./features/course-groups/Courses";
import CreateCourse from "./features/course-groups/CreateCourse";
import Get from "./utility/Get";
import { getUserData } from "./utility/endpoints/UserEndpoints";
import { UserType } from "./utility/types/UserTypes";
import { DialogWrapper } from "./components/ui-wrappers/DialogWrapper";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
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
import { applyUserSettings, normalizeUserSettings } from "./utility/Themes";
import Library from "./features/library/Library";
import ViewFolder from "./features/library/ViewFolder";
import OldEditPrompt from "./features/prompts/EditPrompt";
import OldPrompts from "./features/prompts/Prompts";
import EditPrompt from "./features/library/EditPrompt";
import CreatePrompt from "./features/library/CreatePrompt";
import LoginError from "./features/authentication/LoginError";
import CreateFile from "./features/library/CreateFile";
import EditFile from "./features/library/EditFile";
import OrgSettings from "./features/org-settings/OrgSettings";
import ModuleReports from "./features/reports/ModuleReports";
import CourseReports from "./features/reports/CourseReports";
import introJs from "intro.js";
import "intro.js/introjs.css";
import { useTranslation } from "./hooks/useTranslation";
import { v4 as uuidv4 } from "uuid";
import { setupAxiosInterceptors } from "./utility/axiosSetup";

function App(): JSX.Element {
  const { t } = useTranslation();
  // user object obtained from backend or local
  const [user, setUser] = useState<UserType | null>(
    localStorage.getItem("papyrusai_user")
      ? JSON.parse(localStorage.getItem("papyrusai_user") ?? "")
      : null
  ); //user info and not just token
  const value = useMemo(() => ({ user, setUser }), [user, setUser]);
  const isProduction = process.env.NODE_ENV === "production";
  // only show if missing data
  const [showUpdateUserInfoModal, setShowUpdateUserInfoModal] =
    useState<boolean>(false);
  //alert pop up
  const [alert, setAlert] = useState<{ message: string; type: AlertType }>({
    message: "",
    type: "info",
  });
  const alertValue = useMemo(() => ({ alert, setAlert }), [alert, setAlert]);
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    setupAxiosInterceptors(() => {
      setUser(null);
      setAuthStatus("unauthenticated");
    });
  }, []);

  useEffect(() => {
    if (user) {
      applyUserSettings(normalizeUserSettings(user));
    }
  }, [user]);

  useEffect(() => {
    const runAuth = async () => {
      try {
        // 1. Check URL hash (Cognito redirect)
        if (window.location.hash.includes("access_token")) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const token = hashParams.get("access_token");

          if (!token) {
            throw new Error("No token in hash");
          }

          localStorage.setItem("papyrusai_access_token", token);

          // clean URL immediately 
          window.history.replaceState({}, document.title, "/");
        }

        // 2. Check token from storage
        const token = localStorage.getItem("papyrusai_access_token");

        if (!token) {
          setAuthStatus("unauthenticated");
          // Note: Comment out next line to run locally
          window.location.replace(process.env.REACT_APP_LOGIN_URL || "");
          return;
        }

        // 3. Fetch user
        const res = await Get(getUserData());

        if (res && res.status < 300 && res.data) {
          setUser(res.data);
          localStorage.setItem("papyrusai_user", JSON.stringify(res.data));

          if (!res.data.name || !res.data.family_name || res.data.name === "") {
            setShowUpdateUserInfoModal(true);
          }

          setAuthStatus("authenticated");
        } else if (res && res.status >= 500) {
          console.error("[app] server error, keeping token");
          setAuthStatus("loading"); // retry state or show UI
        } else {
          throw new Error("Invalid token");
        }
      } catch (err) {
        console.error("[app] auth failed:", err);

        localStorage.removeItem("papyrusai_access_token");
        localStorage.removeItem("papyrusai_user");
        localStorage.removeItem("sessionId");
        setUser(null);

        setAuthStatus("unauthenticated");
        // Note: Comment out next line to run locally
        window.location.replace(process.env.REACT_APP_LOGIN_URL || "");
      }
    };

    runAuth();
  }, []);

  //create a session id that gets sent with every request or log so we can track 
  // which user did what. save in local so it is the same across tabs
  useEffect(() => {
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("sessionId", sessionId);
    }
  }, [user])

  //handle log out
  function handleLogOut() {
    localStorage.clear();
    setUser(null);
    window.location.replace(
      process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : ""
    );
  }

  //if we are still figuring out auth, show loading
  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin " />
      </div>
    );
  }

  return (
    <CacheBuster
      currentVersion={packageInfo.version}
      isEnabled={isProduction} //If false, the library is disabled.
      isVerboseMode={false} //If true, the library writes verbose logs to console.
      loadingComponent={
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">{t("loadingMessage.loading")}...</span>
        </div>
      } //If not pass, nothing appears at the time of new version check.
    >
      <div className="flex flex-row justify-center bg-background">
        <a
          href="#main-content"
          className="skip-link"
        >
          {t("navigation.skipToMain")}
        </a>
        <UserContext.Provider value={value}>
          <AlertContext.Provider value={alertValue}>
            <Router>
              <DialogWrapper
                open={showUpdateUserInfoModal}
                onOpenChange={() => { }}
                title={t("dashboard.missingDetails")}
                contentClassName="sm:max-w-md max-h-[90vh] flex flex-col [&>button]:hidden"
                actions={[
                  {
                    label: t("navigation.logout"),
                    onClick: () => handleLogOut(),
                    variant: "secondary",
                  },
                ]}
                footerClassName="w-full"
              >
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <MissingUserInfoForm
                    user={user ? user : undefined}
                    closeForm={(updatedUser) => {
                      setUser(updatedUser);
                      localStorage.setItem("papyrusai_user", JSON.stringify(updatedUser));
                      setShowUpdateUserInfoModal(false);

                      //Handle new user tutorial
                      //Note: not updating this with language since the default is english and can't be changed until after this
                      introJs()
                        .setOptions({
                          steps: [
                            { intro: t("dashboard.tutorial1") },
                            { intro: t("dashboard.tutorial2") },
                            { intro: t("dashboard.tutorial3") },
                            {
                              intro: updatedUser.groups?.includes(
                                process.env.REACT_APP_INSTRUCTOR
                                  ? process.env.REACT_APP_INSTRUCTOR
                                  : "PapyrusAIInstructors"
                              )
                                ? t("dashboard.tutorial4Instructors")
                                : t("dashboard.tutorial4Students"),
                            },
                          ],
                        })
                        .start();
                    }}
                  />
                </div>
              </DialogWrapper>
              <Routes>
                <Route
                  path="/login"
                  element={<Login />}
                />
                <Route path="/login-error" element={<LoginError />} />
                <Route path="*" element={<div>{t("navigation.pageNotFound")}</div>} />

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
                      authStatus={authStatus}
                    />
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                </Route>

                <Route path="/courses" element={<PrivateRoute user={user} authStatus={authStatus} />}>
                  <Route path="/courses" element={<Courses />} />
                </Route>

                <Route path="/modules" element={<PrivateRoute user={user} authStatus={authStatus} />}>
                  <Route path="/modules" element={<AllModules />} />
                </Route>

                <Route
                  path="/courses/:id/modules"
                  element={<PrivateRoute user={user} authStatus={authStatus} />}
                >
                  <Route path="/courses/:id/modules" element={<Modules />} />
                </Route>

                <Route
                  path="/courses/:id/modules/:id"
                  element={<PrivateRoute user={user} authStatus={authStatus} />}
                >
                  <Route
                    path="/courses/:id/modules/:id"
                    element={<ConversationList />}
                  />
                </Route>

                <Route
                  path="/chat/:username/:courseId/:moduleId"
                  element={<PrivateRoute user={user} authStatus={authStatus} />}
                >
                  <Route element={<ChatLayout />}>
                    <Route path=":conversationIndex" element={<Chat />} />
                  </Route>
                </Route>

                <Route path="/account" element={<PrivateRoute user={user} authStatus={authStatus} />}>
                  <Route path="/account" element={<Account />} />
                </Route>

                <Route path="/about" element={<PrivateRoute user={user} authStatus={authStatus} />}>
                  <Route path="/about" element={<About />} />
                </Route>

                {/* if the user has a group with "-TA" in it, then allow access  */}
                {((user &&
                  user.groups &&
                  user.groups.find((a) => a.includes("-TA"))) ||
                  user?.groups.includes(
                    process.env.REACT_APP_INSTRUCTOR
                      ? process.env.REACT_APP_INSTRUCTOR
                      : "PapyrusAIInstructors"
                  )) && (
                    <>
                      <Route
                        path="/courses/:id/createmodule"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/courses/:id/createmodule"
                          element={<AddModule />}
                        />
                      </Route>

                      <Route
                        path="/courses/:id/editmodule/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/courses/:id/editmodule/:id"
                          element={<EditModule />}
                        />
                      </Route>

                      <Route
                        path="/reports"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route path="/reports" element={<Reports />} />
                      </Route>

                      <Route
                        path="/reports/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route path="/reports/:id" element={<UserReports />} />
                      </Route>

                      <Route
                        path="/reports/course/:courseId"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/reports/course/:courseId"
                          element={<CourseReports />}
                        />
                      </Route>

                      <Route
                        path="/reports/module/:id/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/reports/module/:id/:id"
                          element={<ModuleReports />}
                        />
                      </Route>

                      {/* shows conversation list of other users  */}
                      <Route
                        path="/courses/:id/modules/:id/username/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/courses/:id/modules/:id/username/:id"
                          element={<ConversationList />}
                        />
                      </Route>
                    </>
                  )}

                {user &&
                  user.groups &&
                  user.groups.includes(
                    process.env.REACT_APP_INSTRUCTOR
                      ? process.env.REACT_APP_INSTRUCTOR
                      : "PapyrusAIInstructors"
                  ) && (
                    <>
                      <Route
                        path="/createcourse"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/createcourse"
                          element={<CreateCourse />}
                        />
                      </Route>

                      <Route
                        path="/editcourse/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/editcourse/:id"
                          element={<EditCourse />}
                        />
                      </Route>

                      <Route
                        path="/library"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route path="/library" element={<Library />} />
                      </Route>

                      <Route
                        path="/library/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route path="/library/:id" element={<ViewFolder />} />
                      </Route>

                      <Route
                        path="/library/org/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/org/:id"
                          element={<ViewFolder />}
                        />
                      </Route>

                      <Route
                        path="/library/org/:id/createprompt"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/org/:id/createprompt"
                          element={<CreatePrompt />}
                        />
                      </Route>

                      <Route
                        path="/library/org/:id/prompts/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/org/:id/prompts/:id"
                          element={<EditPrompt />}
                        />
                      </Route>

                      <Route
                        path="/library/:id/createprompt"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/:id/createprompt"
                          element={<CreatePrompt />}
                        />
                      </Route>

                      <Route
                        path="/library/:id/prompts/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/:id/prompts/:id"
                          element={<EditPrompt />}
                        />
                      </Route>

                      <Route
                        path="/library/org/:id/createfile"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/org/:id/createfile"
                          element={<CreateFile />}
                        />
                      </Route>

                      <Route
                        path="/library/org/:id/files/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/org/:id/files/:id"
                          element={<EditFile />}
                        />
                      </Route>

                      <Route
                        path="/library/:id/createfile"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/:id/createfile"
                          element={<CreateFile />}
                        />
                      </Route>

                      <Route
                        path="/library/:id/files/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/library/:id/files/:id"
                          element={<EditFile />}
                        />
                      </Route>
                    </>
                  )}
                {/* hidden on nagivation  */}
                {user &&
                  user.groups &&
                  user.groups.includes(
                    process.env.REACT_APP_ADMIN
                      ? process.env.REACT_APP_ADMIN
                      : "PapyrusAIAdmin"
                  ) && (
                    <>
                      <Route
                        path="/prompts"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route path="/prompts" element={<OldPrompts />} />
                      </Route>

                      <Route
                        path="/prompts/:id"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route
                          path="/prompts/:id"
                          element={<OldEditPrompt />}
                        />
                      </Route>

                      <Route
                        path="/org-settings"
                        element={<PrivateRoute user={user} authStatus={authStatus} />}
                      >
                        <Route path="/org-settings" element={<OrgSettings />} />
                      </Route>
                    </>
                  )}
              </Routes>
            </Router>
          </AlertContext.Provider>
        </UserContext.Provider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </div>
    </CacheBuster>
  );
}

export default App;