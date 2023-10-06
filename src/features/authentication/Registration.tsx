import { Box, Button, FormLabel, Link, TextField } from "@mui/material";
import React, { useState } from "react";
// import { useNavigate } from "react-router";


interface RegistrationProps {
  setUser: (user: any) => void;
}

export default function Registration(props: RegistrationProps): JSX.Element {
  // let navigator = useNavigate();
  const [session, setSession] = useState({
    username: "",
    password: "",
    classCode: "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [classCodeError, setClassCodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.username === "" || session.username.length === 0) {
      setUsernameError("This field cannot be empty.");
    } else {
      setUsernameError("");
    }
    if (session.password === "" || session.password.length === 0) {
      setPasswordError("This field cannot be empty.");
    } else {
      setPasswordError("");
    }
    if (session.classCode === "" || session.classCode.length === 0) {
      setClassCodeError("This field cannot be empty.");
    } else {
      setClassCodeError("");
    }

    if (session.username !== "" && session.password !== "" && session.classCode !== "") {
      setIsLoading(true);
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append("username", session.username);
      formData.append("password", session.password);
      //TODO
      // Post(v3Login(organization.pk), formData).then((val) => {
      //   if (val.status && val.status < 300) {
      //     //save user to local
      //     localStorage.setItem(
      //       "vstreamer_user",
      //       JSON.stringify(val.data.data)
      //     );
      //     localStorage.setItem("sessionid", val.data.data.sessionid);
      //     //update App with user info
      //     props.setUser(val.data.data);
      //     //redirect to home page
      //     navigator("/");
      //   } else {
      //     setIsLoading(false);
      //     if (val.data && val.data.form && val.data.form.errors) {
      //       setUsernameError(
      //         val.data.form.errors[Object.keys(val.data.form.errors)[0]]
      //       );
      //       setPasswordError(
      //         val.data.form.errors[Object.keys(val.data.form.errors)[0]]
      //       );
      //     }
      //   }
      // });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession({ ...session, [e.target.name]: e.target.value });
  }

  return (
    <div className="authentication">
      <div className="authentication__logo">
        <img src="/dll-logo-nobackground.png" alt="PapyrusAI logo" />
        <h1 className="">PapyrusAI</h1>
      </div>
      <Box className="login">
        <form onSubmit={handleSubmit}>
          <FormLabel sx={{ margin: ".5rem 0" }}>Sign In</FormLabel>
          <TextField
            name="username"
            label="Email"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={session.username}
            onChange={handleChange}
            error={usernameError !== ""}
            helperText={usernameError}
            disabled={isLoading}
          />
          <TextField
            label="Password"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            type="password"
            value={session.password}
            onChange={handleChange}
            name="password"
            error={passwordError !== ""}
            helperText={passwordError}
            disabled={isLoading}
          />
          <TextField
            label="Class Code"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={session.classCode}
            onChange={handleChange}
            name="password"
            error={classCodeError !== ""}
            helperText={classCodeError}
            disabled={isLoading}
          />
          <Button
            sx={{ width: "100%" }}
            variant="contained"
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Create Account
          </Button>
          <hr />
          <div>
            <span>Already a user?&nbsp;</span>
            <Link href={"/login"}>Log In</Link>
          </div>
        </form>
      </Box>

    </div>
  )
}