import React, { useContext, useState } from "react";
import { Button, Box, TextField } from "@mui/material";
import Post from "../../utility/Post";
import { postAddUserToCourseGroup } from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";

/**
 * This form is to update user's missing data
 * Note: This is hard coded with only name and family_name 
 */

interface MissingUserInfoFormProps {
  closeForm: () => void,
}

export default function AddCourseForm({
  closeForm
}: MissingUserInfoFormProps): JSX.Element {
  //New user information
  const [session, setSession] = useState<{
    signUpCode: string,
  }>({
    signUpCode: "",
  });
  const [errors, setErrors] = useState<{
    signUpCode: string,
  }>({
    signUpCode: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setAlert } = useContext(AlertContext);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.signUpCode === "") {
      setErrors((prev) => ({ ...prev, signUpCode: "Sign up code missing" }))
    }
    else {
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postAddUserToCourseGroup(), session).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //close modal if user data was updated
            closeForm();
            setAlert({ message: "You have been added to the course.", type: "info" });
          }
        } else {
          // set errors
          setErrors({ signUpCode: "Course Not Found" });
          setSession({ signUpCode: "" });
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
    <div className="addcourseform">
      <Box className="addcourseform__add">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
          <span>Enter the unique course sign up code associated with the course you want to join. Not sure what the sign up code is? Ask the instructor of the course!</span>
          &nbsp;&nbsp;&nbsp;
          <TextField
            name="signUpCode"
            label="Enter sign up code"
            fullWidth
            placeholder="ENG190WFall2023"
            sx={{ margin: ".5rem 0" }}
            value={session.signUpCode}
            onChange={handleChange}
            error={errors.signUpCode !== ""}
            helperText={errors.signUpCode}
            disabled={isLoading}
          />
          &nbsp;&nbsp;&nbsp;
          <Button
            variant="contained"
            onClick={handleSubmit}
            type="submit"
          >
            Join Course
          </Button>
        </form>
      </Box>
    </div>
  )
}