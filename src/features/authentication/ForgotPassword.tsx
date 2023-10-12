import { Box, Button, FormLabel, Link, TextField } from "@mui/material";
import React, { useState } from "react";
// import { useNavigate } from "react-router";


interface ForgotPasswordProps {
  setUser: (user: any) => void;
}

// implement
export default function ForgotPassword(props: ForgotPasswordProps): JSX.Element {
  // let navigator = useNavigate();
  const [session, setSession] = useState({
    username: "",
    password: "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.username === "" || session.username.length === 0) {
      setUsernameError("This field cannot be empty.");
    } else {
      setUsernameError("");
    }

    if (session.username !== "" && session.password !== "") {
      setIsLoading(true);
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append("username", session.username);
      formData.append("password", session.password);
      //
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
          <FormLabel sx={{ margin: ".5rem 0" }}>Forgot Password?</FormLabel>
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
          <Button
            sx={{ width: "100%" }}
            variant="contained"
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Send Verification Code
          </Button>
          <hr />
          <div>
            <span>Not a user yet?&nbsp;</span>
            <Link href={"/register"}>Create Account</Link>
          </div>
        </form>
      </Box>

    </div>
  )
}