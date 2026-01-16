// import { Button } from "@mui/material";
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import axios from "axios";
import { getUserData } from "../../utility/endpoints/UserEndpoints";


interface LoginProps {
  setUser: (user: any) => void;
}

export default function Login(props: LoginProps): JSX.Element {
  const location = useLocation();
  let navigator = useNavigate();

  useEffect(() => {
    function getUserInfo(token: string) {
      const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "") + getUserData();
      axios
        .get(API_URL, {
          headers: {
            Authorization: token,
          },
        })
        .then((response) => {
          console.log("login user", response.data)
          props.setUser(response.data);
          localStorage.setItem("papyrusai_user", JSON.stringify(response.data));
          console.log("login nav to home")
          navigator("/")
          // return response;
        })
        .catch(function (error) {
          console.log("error", error)
          if (error.code === "ERR_CANCELED") return;
          if (error.code === "ERR_NETWORK") {
            window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "");
          }
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // showMsg(Object.values(error.response.data), "error");
            if (error.response.status === 401) {
              window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "");
            }
            return error.response;
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
          } else {
            // Something happened in setting up the request that triggered an Error
          }
          return error;
        });
    }
    //Clear localstorage before redirecting or anything else
    localStorage.clear()
    //Currently, this page just saves the token and then navigates to the home page
    if (location.hash) {
      console.log("location hash", location.hash)
      if (location.hash.split("#")[1].split("=")[0] === "error_description") {
        setTimeout(() => {
          navigator('/login-error', { state: { message: location.hash.split("#")[1].split("=")[1].split("&")[0].replaceAll("+", " ") } });
        }, 500);
      } else {
        const hash = location.hash.split("&")
        var token = "";
        console.log("hash", hash)
        if (hash[0].startsWith("#id")) {
          //get access token if normal login
          token = location.hash.split("&")[1].split("=")[1];
        } else {
          //get access token if google login
          token = location.hash.split("&")[0].split("=")[1];
        }
        localStorage.setItem("papyrusai_access_token", token);
        setTimeout(() => {
          getUserInfo(token)
        }, 500);

      }
    }
    // Place any token found in params into local storage
    else if (new URLSearchParams(location.search).has("papyrusai_access_token")) {
      const params = new URLSearchParams(location.search);
      console.log("here1", params)
      const token = params.get("papyrusai_access_token") as string;
      localStorage.setItem("papyrusai_access_token", token);
      setTimeout(() => {
        getUserInfo(token);
      }, 500);
    }
    else if (!localStorage.getItem("papyrusai_access_token")) {
      console.log("here2 login window.replace login")
      window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "");
    }
    else {
      console.log("here3, nav to home")
      navigator("/");
    }
    // eslint-disable-next-line
  }, []);


  return (
    <div>
    </div>
  )



  // NOTE: THIS IS THE NON AWS LOGIN PAGE
  // const [session, setSession] = useState({
  //   username: "",
  //   password: "",
  // });
  // const [usernameError, setUsernameError] = useState("");
  // const [passwordError, setPasswordError] = useState("");
  // const [isLoading, setIsLoading] = useState(false);

  // function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault();
  //   if (session.username === "" || session.username.length === 0) {
  //     setUsernameError("This field cannot be empty.");
  //   } else {
  //     setUsernameError("");
  //   }
  //   if (session.password === "" || session.password.length === 0) {
  //     setPasswordError("This field cannot be empty.");
  //   } else {
  //     setPasswordError("");
  //   }

  //   if (session.username !== "" && session.password !== "") {
  //     setIsLoading(true);
  //     const FormData = require("form-data");
  //     const formData = new FormData();
  //     formData.append("username", session.username);
  //     formData.append("password", session.password);
  //     //
  //     // Post(v3Login(organization.pk), formData).then((val) => {
  //     //   if (val.status && val.status < 300) {
  //     //     //save user to local
  //     //     localStorage.setItem(
  //     //       "vstreamer_user",
  //     //       JSON.stringify(val.data.data)
  //     //     );
  //     //     localStorage.setItem("sessionid", val.data.data.sessionid);
  //     //     //update App with user info
  //     //     props.setUser(val.data.data);
  //     //     //redirect to home page
  //     //     navigator("/");
  //     //   } else {
  //     //     setIsLoading(false);
  //     //     if (val.data && val.data.form && val.data.form.errors) {
  //     //       setUsernameError(
  //     //         val.data.form.errors[Object.keys(val.data.form.errors)[0]]
  //     //       );
  //     //       setPasswordError(
  //     //         val.data.form.errors[Object.keys(val.data.form.errors)[0]]
  //     //       );
  //     //     }
  //     //   }
  //     // });
  //   }
  // }

  // function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  //   setSession({ ...session, [e.target.name]: e.target.value });
  // }

  // return (
  //   <div className="authentication">
  //     <div className="authentication__logo">
  //       <img src="/dll-logo-nobackground.png" alt="PapyrusAI logo" />
  //       <h1 className="">PapyrusAI</h1>
  //     </div>
  //     <Box className="login">
  //       <form onSubmit={handleSubmit}>
  //         <FormLabel sx={{ margin: ".5rem 0" }}>Sign In</FormLabel>
  //         <TextField
  //           name="username"
  //           label="Email"
  //           fullWidth
  //           sx={{ margin: ".5rem 0" }}
  //           value={session.username}
  //           onChange={handleChange}
  //           error={usernameError !== ""}
  //           helperText={usernameError}
  //           disabled={isLoading}
  //         />
  //         <TextField
  //           label="Password"
  //           fullWidth
  //           sx={{ margin: ".5rem 0" }}
  //           type="password"
  //           value={session.password}
  //           onChange={handleChange}
  //           name="password"
  //           error={passwordError !== ""}
  //           helperText={passwordError}
  //           disabled={isLoading}
  //         />
  //         <Button
  //           sx={{ width: "100%" }}
  //           variant="contained"
  //           type="submit"
  //           onClick={handleSubmit}
  //           disabled={isLoading}
  //         >
  //           Login
  //         </Button>
  //         <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "1rem" }}>
  //           <Button
  //             disabled={isLoading}
  //             onClick={() => navigator("/forgot-password")}
  //           >
  //             Forgot Password?
  //           </Button>
  //         </div>
  //         <hr />
  //         <Button
  //           sx={{ width: "100%", marginTop: "1rem" }}
  //           variant="contained"
  //           color="secondary"
  //           onClick={() => navigator("/register")}
  //           disabled={isLoading}
  //         >
  //           Create Account
  //         </Button>
  //       </form>
  //     </Box>

  //   </div>
  // )
}