import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Box, TextField, FormLabel } from "@mui/material";
import { postCreateCourse } from "../../utility/endpoints/CourseEndpoints";
import Post from "../../utility/Post";
import { Checkbox } from "../../components/Checkbox";

type AddCourseType = {
  name: string,
  signUpCode: string,
  isActive: boolean
}

export default function CreateCourse(): JSX.Element {
  let navigator = useNavigate();
  const [session, setSession] = useState<AddCourseType>({
    name: "",
    signUpCode: "",
    isActive: false
  });
  const [errors, setErrors] = useState<AddCourseType>({
    name: "",
    signUpCode: "",
    isActive: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if(session.name === "") {
      setErrors((prev) => ({...prev, name: "Name missing"}))
    }
    else if(session.signUpCode === "") {
      setErrors((prev) => ({...prev, signUpCode: "Sign up code missing"}))
    } else {
      //create course
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postCreateCourse(), session).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //redirect to course list
            navigator("/");
            //TODO some kind of pop up notifying user of creation
          }
        } else {
          // set errors
          setErrors({name: res.data, signUpCode: res.data, isActive: res.data})
        }
        // set is loading back 
        setIsLoading(false);
      });
      
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="courses">
      <div className="courses__section-header">
        <h3>Create Course</h3>
        
        <div>
          <Button variant="contained" onClick={handleSubmit} type="submit">Save</Button>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={() => navigator("/")} color="secondary">Cancel</Button>
        </div>
      </div>
      <hr />
      <Box className="courses__add">
        <form onSubmit={handleSubmit}>
          <FormLabel>Enter Course Information</FormLabel>
          <TextField
            name="name"
            label="Course Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={session.name}
            onChange={handleChange}
            error={errors.name !== ""}
            helperText={errors.name}
            disabled={isLoading}
          />
          <TextField
            name="signUpCode"
            label="Course Sign Up Code"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            placeholder="FALLCSE100ISCOOL"
            value={session.signUpCode}
            onChange={handleChange}
            error={errors.signUpCode !== ""}
            helperText={errors.signUpCode}
            disabled={isLoading}
          />
          <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                isActive: !session.isActive
              }))
            }}
            checked={session.isActive}
            isDisabled={isLoading}
          >
            <span>
              Active
            </span>
          </Checkbox>
          <p>Setting course as active will allow other users to be able to access this course.</p>
        </form>
      </Box>
    </div>
  ) 
}