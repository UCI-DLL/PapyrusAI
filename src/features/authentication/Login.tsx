// import { Button } from "@mui/material";
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import axios from "axios";
import { getUserData, logEvent } from "../../utility/endpoints/UserEndpoints";
import Post from "../../utility/Post";

const COGNITO_LOGIN_URL = process.env.REACT_APP_LOGIN_URL || "";

// Redirect to Cognito, but only once. If we already retried, stop and show
// an error instead of looping forever between Cognito and our app.
function safeRedirectToCognito(navigator: ReturnType<typeof useNavigate>) {
  const key = "papyrusai_login_retried";
  if (!sessionStorage.getItem(key)) {
    console.log("[login] first redirect attempt to Cognito — allowing retry")
    sessionStorage.setItem(key, "true");
    window.location.replace(COGNITO_LOGIN_URL);
  } else {
    console.error("[login] already retried once — breaking the loop, sending to error page")
    sessionStorage.removeItem(key);
    navigator('/login-error', { state: { message: "Login failed after retrying. Please try again later or contact support." } });
  }
}

interface LoginProps {
  setUser: (user: any) => void;
}

export default function Login(props: LoginProps): JSX.Element {
  const location = useLocation();
  let navigator = useNavigate();

  useEffect(() => {
    // Signal to App.tsx that we're handling the OAuth callback — prevents
    // the competing useEffect in App from also fetching user data and
    // potentially causing a redirect loop on transient errors.
    console.log("[login] Login component mounted, setting login_in_progress flag")
    sessionStorage.setItem("papyrusai_login_in_progress", "true");

    if (location.hash) {
      console.log("[login] hash detected in URL")

      // Parse hash params properly by name instead of relying on position.
      // Cognito doesn't guarantee fragment param order, and positional
      // parsing might break when Google OAuth returned params in a different order.
      const hashParams = new URLSearchParams(location.hash.substring(1));
      console.log("[login] hash params parsed — keys:", Array.from(hashParams.keys()).join(", "))

      if (hashParams.get("error_description")) {
        const errorMessage = (hashParams.get("error_description") || "").replaceAll("+", " ");
        console.log("[login] error_description found in hash:", errorMessage)
        setTimeout(() => {
          navigator('/login-error', { state: { message: errorMessage } });
        }, 500);
      } else {
        // Clear localstorage before redirecting or anything else
        localStorage.clear()

        //handle logging login
        const hash = location.hash.split("&")
        if (hash[0].startsWith("#id")) {
          //get access token if normal login
          //log page
          Post(logEvent(), {
            eventType: "view_page",
            metadata: {
              data: "new_token",
              page: "login",
            }
          })
        } else {
          //get access token if google login
          //log page
          Post(logEvent(), {
            eventType: "view_page",
            metadata: {
              data: "google_token",
              page: "login",
            }
          })
        }

        // grab the access_token by name
        const token = hashParams.get("access_token") || "";
        console.log("token extracted from hash", token ? "present" : "missing")

        if (!token) {
          console.error("No access_token found in OAuth callback hash")
          navigator('/login-error', { state: { message: "Login failed — no access token received. Please try again." } });
          return;
        }

        localStorage.setItem("papyrusai_access_token", token);

        setTimeout(() => {
          console.log("start getting user info")
          getUserInfo(token)
        }, 500);

      }
    }
    // Place any token found in params into local storage
    else if (new URLSearchParams(location.search).has("papyrusai_access_token")) {
      console.log("[login] token found in query params")
      //Clear localstorage before redirecting or anything else
      localStorage.clear()
      const params = new URLSearchParams(location.search);
      const token = params.get("papyrusai_access_token") as string;
      localStorage.setItem("papyrusai_access_token", token);
      //log page
      Post(logEvent(), {
        eventType: "view_page",
        metadata: {
          data: "sso_token",
          page: "login",
        }
      })
      setTimeout(() => {
        getUserInfo(token);
      }, 500);
    }
    else if (!localStorage.getItem("papyrusai_access_token")) {
      console.log("[login] no hash, no query param, no stored token — redirecting to Cognito")
      //Clear localstorage before redirecting or anything else
      localStorage.clear()
      safeRedirectToCognito(navigator);
    }
    else {
      console.log("[login] token already in localStorage, navigating to dashboard")
      navigator("/");
    }

    return () => {
      console.log("[login] Login component unmounting, clearing login_in_progress flag")
      sessionStorage.removeItem("papyrusai_login_in_progress");
    };
    // eslint-disable-next-line
  }, []);

  function getUserInfo(token: string) {
    const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "") + getUserData();
    let sessionId = localStorage.getItem("sessionId") ?? "unknown";
    axios
      .get(API_URL, {
        headers: {
          Authorization: token,
          "X-Session-Id": sessionId,
        },
      })
      .then((response) => {
        console.log("[login] getUserInfo success, status:", response.status)
        // login worked — clear the retry flag so future logins start fresh
        sessionStorage.removeItem("papyrusai_login_retried");
        props.setUser(response.data);
        localStorage.setItem("papyrusai_user", JSON.stringify(response.data));
        console.log("[login] user data saved, navigating to dashboard")
        navigator("/")
      })
      .catch(function (error) {
        console.error("[login] getUserInfo failed:", error.code, error.message)
        if (error.code === "ERR_CANCELED") return;

        // Network errors (e.g. Lambda cold start, brief offline) shouldn't
        // immediately boot the user back to Cognito — that's how loops start.
        if (error.code === "ERR_NETWORK") {
          console.error("[login] network error — using safe redirect")
          safeRedirectToCognito(navigator);
          return;
        }
        if (error.response) {
          console.error("[login] server responded with status:", error.response.status)
          if (error.response.status === 401) {
            // token is genuinely invalid, redirect to Cognito (with loop protection)
            console.log("[login] 401 — token invalid, using safe redirect")
            safeRedirectToCognito(navigator);
          } else if (error.response.status >= 500) {
            // server hiccup — don't redirect, just show an error
            console.error("[login] 5xx — server error, showing error page instead of redirecting")
            navigator('/login-error', { state: { message: "Our server is temporarily unavailable. Please try again in a moment." } });
          }
          return error.response;
        } else if (error.request) {
          // request sent but no response — treat like network error
          console.error("[login] request sent but no response received — using safe redirect")
          safeRedirectToCognito(navigator);
        }
        return error;
      });
  }

  return (
    <div>
    </div>
  )
}