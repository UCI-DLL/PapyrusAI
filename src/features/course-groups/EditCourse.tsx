import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, Box, TextField, FormLabel } from "@mui/material";
import Get from "../../utility/Get";
import { getCourse, putUpdateCourse } from "../../utility/endpoints/CourseEndpoints";
import Put from "../../utility/Put";
import { CourseType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";

type EditCourseType = {
  name: string,
  signUpCode: string,
  isDeleted: boolean,
  isActive: boolean,
}

export default function EditCourse(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditCourseType>({
    name: "",
    signUpCode: "",
    isDeleted: false,
    isActive: false,
  });
  const [prevSession, setPrevSession] = useState<CourseType | undefined>();
  const [errors, setErrors] = useState<EditCourseType>({
    name: "",
    signUpCode: "",
    isDeleted: false,
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    //TODO handle redirecting students off this page

    const controller = new AbortController();
    //get pathname to figure out if we are editing 
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "editcourse" &&
      location.pathname.split("/")[2]
    ) {
      //get prev course data
      const courseId = location.pathname.split("/")[2];
      Get(getCourse(courseId), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //set prev course data
            setPrevSession(res.data);
            //also set session
            setSession({
              name: res.data.name,
              signUpCode: res.data.signUpCode,
              isDeleted: res.data.isDeleted,
              isActive: res.data.isActive
            });
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          //handle error
          setError("Course Does Not Exist");
        }
        setIsLoading(false);
      });
    }
    // eslint-disable-next-line
  }, [location.pathname]);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Name missing" }))
    }
    else if (session.signUpCode === "") {
      setErrors((prev) => ({ ...prev, signUpCode: "Sign up code missing" }))
    } else {
      //Update course
      if (prevSession) {
        // set is loading
        setIsLoading(true);
        //dont send signupcode if it didnt change
        if (prevSession.signUpCode === session.signUpCode) {
          const dataToSend = {
            name: session.name,
            isActive: session.isActive,
            isDeleted: session.isDeleted
          }
          // post data back
          Put(putUpdateCourse(prevSession.id), dataToSend).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //TODO some kind of pop up notifying user of creation
              }
            } else {
              // set errors
              setErrors({
                name: res.data,
                signUpCode: res.data,
                isDeleted: res.data,
                isActive: res.data
              });
            }
            // set is loading back 
            setIsLoading(false);
          });
        } else {
          // post data back
          Put(putUpdateCourse(prevSession.id), session).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //TODO some kind of pop up notifying user of creation
              }
            } else {
              // set errors
              setErrors({
                name: res.data,
                signUpCode: res.data,
                isDeleted: res.data,
                isActive: res.data
              })
            }
            // set is loading back 
            setIsLoading(false);
          });
        }

      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return !error && prevSession ? (
    <div className="courses">
      <div className="courses__section-header">
        <h3>Edit {prevSession.name}</h3>
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
          <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                isDeleted: !session.isDeleted
              }))
            }}
            checked={session ? session.isDeleted : false}
            isDisabled={isLoading}
          >
            <span>
              Delete
            </span>
          </Checkbox>
        </form>
      </Box>
    </div>
  ) : (
    <div>Course Not Found</div>
  )
}