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
      default: "#20242b",
    },
    text: {
      primary: "#000",
    },
    primary: { main: "#ff8900" },
    secondary: { main: "#fff" },
    error: { main: "#f03434" },
    white: palette.augmentColor({
      color: {
        main: "#fff",
      },
    }),
    // custom: {
    //   light: '#ffa726'
    //   main: '#f57c00',
    //   dark: '#ef6c00',
    //   contrastText: 'rgba(0, 0, 0, 0.87)',
    // }
  },
  typography: {
    button: {
      textTransform: "none",
    },
  },
});

function App(): JSX.Element {
  // user object obtained from backend or local
  //TODO user Type
  const [user, setUser] = useState<any | null>(
    localStorage.getItem("papyrusai_user")
      ? JSON.parse(localStorage.getItem("papyrusai_user") ?? "")
      : null
  ); //user info and not just sessionid
  const value = useMemo(() => ({ user, setUser }), [user, setUser]);
  const isProduction = process.env.NODE_ENV === "production";


  useEffect(() => {
    // call backend for user info and save in state
    let temp_user = { pk: 0 };
    if (localStorage.getItem("papyrusai_user")) {
      temp_user = JSON.parse(localStorage.getItem("papyrusai_user") ?? "");
      setUser(temp_user);
    }

    // get user's most update-to-date info
    //TODO
    // Get(v3UserDetailPrivate(temp_user.pk)).then((res) => {
    //   if (res.status && res.status < 300) {
    //     if (res.data && res.data.data) {
    //       //update our version of user
    //       setUser(res.data.data);
    //       localStorage.setItem("papyrusai_user", JSON.stringify(res.data.data));
    //     }
    //   } else {
    //     //remove user data
    //     localStorage.removeItem("sessionid");
    //     localStorage.removeItem("papyrusai_user");
    //     setUser(null);
    //   }
    // });
  }, []);

  //handle log out
  // function handleLogOut() {
  //   localStorage.clear();
  //   setUser(null);
  // }

  return (
    <CacheBuster
      currentVersion={packageInfo.version}
      isEnabled={isProduction} //If false, the library is disabled.
      isVerboseMode={false} //If true, the library writes verbose logs to console.
      loadingComponent={<div>Loading...</div>} //If not pass, nothing appears at the time of new version check.
    >
      <div>
        <UserContext.Provider value={value}>
          <Router>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Routes>
                <Route
                  path="/login"
                  element={<Login setUser={(u) => setUser(u)} />}
                />
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
              </Routes>
            </ThemeProvider>
          </Router>
        </UserContext.Provider>
      </div>
    </CacheBuster>
  );
}

export default App;
