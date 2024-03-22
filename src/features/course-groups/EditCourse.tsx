import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControl,
  Autocomplete,
  Chip
} from "@mui/material";
import Get from "../../utility/Get";
import { getCourse, putUpdateCourse } from "../../utility/endpoints/CourseEndpoints";
import Put from "../../utility/Put";
import { CourseType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import LinearProgress from '@mui/material/LinearProgress';
import { AlertContext } from "../../utility/context/AlertContext";
import { CustomUserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { getUserList } from "../../utility/endpoints/UserEndpoints";

type EditCourseType = {
  name: string,
  signUpCode: string,
  isDeleted: boolean,
  isActive: boolean,
  year: string,
  section: string,
  term: string,
  taList: any,
}

export default function EditCourse(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditCourseType>({
    name: "",
    signUpCode: "",
    isDeleted: false,
    isActive: false,
    year: "",
    section: "",
    term: "",
    taList: [],
  });
  const [prevSession, setPrevSession] = useState<CourseType | undefined>();
  const [errors, setErrors] = useState<EditCourseType>({
    name: "",
    signUpCode: "",
    isDeleted: false,
    isActive: false,
    year: "",
    section: "",
    term: "",
    taList: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const { setAlert } = useContext(AlertContext);
  const [userList, setUserList] = useState<Array<CustomUserType>>([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const controller = new AbortController();

    if (userList.length === 0) {
      getUsers("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
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
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //set prev course data
            setPrevSession(res.data);
            //also set session
            setSession({
              name: res.data.name,
              signUpCode: res.data.signUpCode,
              isDeleted: res.data.isDeleted,
              isActive: res.data.isActive,
              year: res.data.year ? res.data.year : "",
              term: res.data.term ? res.data.term : "",
              section: res.data.section ? res.data.section : "",
              taList: res.data.taList ? res.data.taList : [],
            });
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            setError("Course Does Not Exist");
            setIsLoading(false);
          }
        }
      });
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function getUsers(PaginationToken: string, signal: AbortSignal) {
    var limit = 50;

    Get(getUserList(limit, PaginationToken), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data["Users"]) {
          //filter out current user and email_verified 
          var tempUserList = res.data["Users"].map((u: CustomUserType) => {
            return {
              name: u.name,
              family_name: u.family_name,
              email: u.email,
              sub: u.sub
            }
          });
          if (user) {
            tempUserList = tempUserList.filter((x: CustomUserType) => x.sub !== user.sub);
          }
          setUserList((prev) => [...prev, ...tempUserList]);

          //handle pages
          //note: PaginationToken will also come back as "undefined" if there are no more pages
          if (res.data["Users"].length >= limit && res.data["PaginationToken"]) {
            getUsers(res.data["PaginationToken"], signal);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
        }
      }
    });
  }


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
            isDeleted: session.isDeleted,
            year: session.year,
            section: session.section,
            term: session.term,
            taList: session.taList,
          }
          // post data back
          Put(putUpdateCourse(prevSession.id), dataToSend).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //pop up notifying user of creation
                setAlert({ message: "Course Updated", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: res.data, type: "error" })
            }
            // set is loading back 
            setIsLoading(false);
          });
        } else {
          // post data back
          Put(putUpdateCourse(prevSession.id), session).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //pop up notifying user of creation
                setAlert({ message: "Course Updated", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: res.data, type: "error" })
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

  function handleTermChange(e: SelectChangeEvent) {
    setSession((prev) => ({ ...prev, term: e.target.value as string }))
  }

  return !isLoading ? (
    <div className="courses">
      {!error && prevSession ? (
        <>
          <div className="courses__section-header">
            <h3>Edit {prevSession.name}</h3>
            <div>
              <Button variant="contained" onClick={handleSubmit} type="submit">Save</Button>
              &nbsp;&nbsp;&nbsp;
              <Button variant="contained" onClick={() => navigator("/")} color="secondary">Cancel</Button>
            </div>
          </div>
          <hr />
          <span>* indicates a required field</span>
          <Box className="courses__add">
            <form onSubmit={handleSubmit}>
              <FormLabel>Enter Course Information</FormLabel>
              <TextField
                name="name"
                label="Course Name"
                placeholder="Eng190W Communications in the Professional World"
                fullWidth
                sx={{ margin: ".5rem 0" }}
                value={session.name}
                onChange={handleChange}
                error={errors.name !== ""}
                helperText={errors.name}
                disabled={isLoading}
                required
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
                required
              />
              <TextField
                name="year"
                label="Year"
                fullWidth
                placeholder="2023"
                sx={{ margin: ".5rem 0" }}
                value={session.year}
                onChange={handleChange}
                error={errors.year !== ""}
                helperText={errors.year}
                disabled={isLoading}
                inputProps={{ min: 0, inputMode: 'numeric', pattern: '[0-9]' }}
                type="number"
              />
              <FormControl fullWidth>
                <InputLabel id="select-term">Term</InputLabel>
                <Select
                  labelId="select-term"
                  id="course-select-term"
                  value={session.term}
                  fullWidth
                  name="term"
                  label="Term"
                  onChange={handleTermChange}
                  error={errors.term !== ""}
                  disabled={isLoading}
                >
                  <MenuItem value={"spring"}>Spring</MenuItem>
                  <MenuItem value={"summer"}>Summer</MenuItem>
                  <MenuItem value={"fall"}>Fall</MenuItem>
                  <MenuItem value={"winter"}>Winter</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="section"
                label="Section / Period"
                placeholder="Section 02"
                fullWidth
                sx={{ margin: ".5rem 0" }}
                value={session.section}
                onChange={handleChange}
                error={errors.section !== ""}
                helperText={errors.section}
                disabled={isLoading}
              />

              <Autocomplete
                value={session.taList}
                onChange={(event, newValue) => {
                  if (newValue.length >= 10) {
                    setErrors((prev) => ({ ...prev, taList: "Max 10 Teaching Assistants" }))
                  } else {
                    setSession(prev => {
                      return { ...prev, taList: newValue }
                    })
                    setErrors((prev) => ({ ...prev, taList: "" }))
                  }
                }}
                multiple
                id="tags-filled"
                options={userList ? userList : []}
                getOptionLabel={(option) => option.name + " " + option.family_name + " - " + option.email}
                freeSolo
                renderTags={(value: CustomUserType[], getTagProps) =>
                  value.map((option: CustomUserType, index: number) => {
                    return (
                      <Chip
                        variant="outlined"
                        label={option.name + " " + option.family_name + " - " + option.email}
                        {...getTagProps({ index })}
                      />
                    )
                  })
                }
                renderInput={(params) => {
                  return (
                    <TextField
                      {...params}
                      label="Teaching Assistant"
                    />
                  )
                }}
              />
              {errors.taList !== "" && (
                <span className="error">{errors.taList}</span>
              )}

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
        </>
      ) : (
        <div>Course Not Found</div>
      )}

    </div>
  ) : (
    <LinearProgress />
  )
}