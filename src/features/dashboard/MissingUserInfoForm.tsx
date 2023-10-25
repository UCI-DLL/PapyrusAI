import React, { useEffect, useState } from "react";
import { UserType } from "../../utility/types/UserTypes";
import { Button, Box, TextField, FormLabel } from "@mui/material";
import Post from "../../utility/Post";
import { postUserData } from "../../utility/endpoints/UserEndpoints";

/**
 * This form is to update user's missing data
 * Note: This is hard coded with only name and family_name 
 */

interface MissingUserInfoFormProps {
  user: UserType | undefined,
  closeForm: (user:UserType) => void,
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
  }>({
    name: "",
    family_name: ""
  });
  const [errors, setErrors] = useState<{
    name: string,
    family_name: string,
  }>({
    name: "",
    family_name: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    //Check if any data is missing, if nothing, then close
    if(user && user.name && user.name !== "" && requireUpdate) {
      //if the user has both name, then close modal
      //NOTE: family name optional
      closeForm(user);
    } else {
      //set new user data based on old data
      if (user && user.name && user.name !== "") {
        setSession((prev) => ({...prev, name: user.name}))
      }
      if (user && user.family_name && user.family_name !== "") {
        setSession((prev) => ({...prev, family_name: user.family_name}))
      }
    }
  }, [user, closeForm, requireUpdate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if(session.name === "") {
      setErrors((prev) => ({...prev, name: "Name missing"}))
    }
    // else if(session.family_name === "") {
    //   setErrors((prev) => ({...prev, family_name: "Family name missing"}))
    // } 
    else {
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postUserData(), session).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //close modal if user data was updated
            closeForm(res.data);
          }
        } else {
          // set errors
          setErrors({name: res.data, family_name: res.data})
        }
        // set is loading back 
        setIsLoading(false);
      })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="missinguserinfo">
      <Box className="missinguserinfo__add">
        <form onSubmit={handleSubmit} style={{display: "flex", flexDirection: "column"}}>
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