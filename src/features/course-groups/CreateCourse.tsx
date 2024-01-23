import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
import { postCreateCourse } from "../../utility/endpoints/CourseEndpoints";
import Post from "../../utility/Post";
import { Checkbox } from "../../components/Checkbox";
import { AlertContext } from "../../utility/context/AlertContext";
import LinearProgress from '@mui/material/LinearProgress';
import Get from "../../utility/Get";
import { getUserList } from "../../utility/endpoints/UserEndpoints";
import { CustomUserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";

type AddCourseType = {
  name: string,
  signUpCode: string,
  isActive: boolean,
  year: string,
  section: string,
  term: string,
  taList: any,
}

export default function CreateCourse(): JSX.Element {
  let navigator = useNavigate();
  const [session, setSession] = useState<AddCourseType>({
    name: "",
    signUpCode: "",
    isActive: false,
    year: "",
    section: "",
    term: "",
    taList: [],
  });
  const [errors, setErrors] = useState<AddCourseType>({
    name: "",
    signUpCode: "",
    isActive: false,
    year: "",
    section: "",
    term: "",
    taList: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [userList, setUserList] = useState<Array<CustomUserType>>([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    if (userList.length === 0) {
      getUsers("", controller.signal);
    } else {
      setIsLoading(false);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function getUsers(PaginationToken: string, signal: AbortSignal) {
    var limit = 50;

    Get(getUserList(limit, PaginationToken), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data["Users"] && res.data["PaginationToken"]) {
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
          if (res.data["Users"].length >= limit) {
            getUsers(res.data["PaginationToken"], signal);
          } else {
            setIsLoading(false);
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
      //create course
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postCreateCourse(), session).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //redirect to course list
            navigator("/");
            // pop up notifying user of creation
            setAlert({ message: "Course Created", type: "success" });
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleTermChange(e: SelectChangeEvent) {
    setSession((prev) => ({ ...prev, term: e.target.value as string }))
  }

  return !isLoading ? (
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
            fullWidth
            placeholder="Section 02"
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
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}