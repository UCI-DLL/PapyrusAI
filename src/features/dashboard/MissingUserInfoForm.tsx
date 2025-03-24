import React, { useContext, useEffect, useState } from "react";
import { UserType } from "../../utility/types/UserTypes";
import { Button, Box, TextField, FormLabel, FormControl, RadioGroup, FormControlLabel, Radio, FormHelperText } from "@mui/material";
import Post from "../../utility/Post";
import { postUserData } from "../../utility/endpoints/UserEndpoints";
import { changeTheme } from "../../utility/Themes";
import { UserContext } from "../../utility/context/UserContext";

/**
 * This form is to update user's missing data
 * Note: This is hard coded with only name and family_name 
 */

interface MissingUserInfoFormProps {
  user: UserType | undefined,
  closeForm: (user: UserType) => void,
  requireUpdate?: boolean,
}

export default function MissingUserInfoForm({
  user,
  closeForm,
  requireUpdate = true
}: MissingUserInfoFormProps): JSX.Element {
  //New user information
  const [session, setSession] = useState<{
    name: string,
    family_name: string,
    theme: string, //"light" | "dark" | "colorful-light" | "colorful-dark",
  }>({
    name: "",
    family_name: "",
    theme: "light",
  });
  const [errors, setErrors] = useState<{
    name: string,
    family_name: string,
    theme: string,
  }>({
    name: "",
    family_name: "",
    theme: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    //Check if any data is missing, if nothing, then close
    if (user && user.name && user.name !== "" && requireUpdate && user.family_name) {
      //if the user has both name, then close modal
      //NOTE: family name optional
      closeForm(user);
    } else {
      //set new user data based on old data
      if (user && user.name && user.name !== "") {
        setSession((prev) => ({ ...prev, name: user.name }))
      }
      if (user && user.family_name && user.family_name !== "") {
        setSession((prev) => ({ ...prev, family_name: user.family_name }))
      }
      if (user && user["custom:theme"] && user["custom:theme"] !== "") {
        setSession((prev) => ({ ...prev, theme: user["custom:theme"] }))
      }
      setIsLoading(false);
    }
  }, [user, closeForm, requireUpdate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Name missing" }))
    }
    // else if(session.family_name === "") {
    //   setErrors((prev) => ({...prev, family_name: "Family name missing"}))
    // } 
    else {
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postUserData(), session).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //close modal if user data was updated
            closeForm(res.data);
            // localStorage.setItem("papyrusai_user", JSON.stringify(res.data));
          }
        } else {
          // set errors
          setErrors({ name: res.data, family_name: res.data, theme: res.data })
        }
        // set is loading back 
        setIsLoading(false);
      })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleThemeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const root = document.documentElement;
    if (user) {
      setUser({ ...user, "custom:theme": e.target.value });
      localStorage.setItem("papyrusai_user", JSON.stringify({ ...user, "custom:theme": e.target.value }));
    }
    if (e.target.value === "dark") {
      changeTheme(root, "dark");
    } else if (e.target.value === "light") {
      changeTheme(root, "light");
    } else if (e.target.value === "colorful-light") {
      changeTheme(root, "colorful-light");
    } else if (e.target.value === "colorful-dark") {
      changeTheme(root, "colorful-dark");
    } else { //default is light
      changeTheme(root, "light");
    }
  }

  return (
    <div className="missinguserinfo">
      <Box className="missinguserinfo__add">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
          <FormLabel>Enter User Information</FormLabel>
          <TextField
            name="name"
            label="Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={session.name}
            onChange={handleChange}
            error={errors.name !== ""}
            helperText={errors.name}
            disabled={isLoading}
          />
          <TextField
            name="family_name"
            label="Family Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={session.family_name}
            onChange={handleChange}
            error={errors.family_name !== ""}
            helperText={errors.family_name}
            disabled={isLoading}
          />
          <FormControl error={errors.theme !== ""}>
            <FormLabel id="theme-radio">Theme</FormLabel>
            <RadioGroup
              aria-labelledby="theme-radio"
              name="theme"
              value={session.theme}
              onChange={handleThemeChange}
            >
              <FormControlLabel value="light" control={<Radio />} label="Light" />
              <FormControlLabel value="dark" control={<Radio />} label="Dark" />
              <FormControlLabel value="colorful-light" control={<Radio />} label="Colorful Light" />
              <FormControlLabel value="colorful-dark" control={<Radio />} label="Colorful Dark" />
            </RadioGroup>
            <FormHelperText>{errors.theme}</FormHelperText>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleSubmit}
            type="submit"
          >
            Save
          </Button>
        </form>
      </Box>
    </div>
  )
}