import React, { useContext, useEffect, useRef, useState } from "react";
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
  Chip,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList
} from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { postCreateCourse } from "../../utility/endpoints/CourseEndpoints";
import Post from "../../utility/Post";
import { AlertContext } from "../../utility/context/AlertContext";
import LinearProgress from '@mui/material/LinearProgress';
import Get from "../../utility/Get";
import { getUserList } from "../../utility/endpoints/UserEndpoints";
import { CustomUserType, UserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { Modal } from "../../components/Modal";

type AddCourseType = {
  name: string,
  signUpCode: string,
  isActive: boolean,
  year: string,
  section: string,
  term: string,
  taList: any,
}

const options = ['Save & Publish', 'Save without Publishing', 'Discard Changes'];

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
  const { user, setUser } = useContext(UserContext);
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);

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

  function handleClick(e: any) {
    if (selectedIndexSave === 0) { //Save and activate
      handleSubmit(e, true);
    } else if (selectedIndexSave === 1) { //save and not activate
      handleSubmit(e, false);
    } else if (selectedIndexSave === 2) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and activate
      handleSubmit(e, true);
    } else if (index === 1) { //save and not activate
      handleSubmit(e, false);
    } else if (index === 2) { //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSave(false);
  };

  const handleToggle = () => {
    setOpenSave((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRefSave.current &&
      anchorRefSave.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenSave(false);
  };

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
              sub: u.sub,
              username: u.username
            }
          });
          if (user) {
            tempUserList = tempUserList.filter((x: CustomUserType) => x.username !== user.username);
          }
          setUserList((prev) => [...prev, ...tempUserList]);

          //handle pages
          //note: PaginationToken will also come back as "undefined" if there are no more pages
          if (res.data["Users"].length >= limit && res.data["PaginationToken"]) {
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
      setIsLoading(false);
    });
  }


  function handleSubmit(e: any, isActive = false) {
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
      const dataToSend = {
        name: session.name,
        signUpCode: session.signUpCode,
        isActive: isActive,
        year: session.year,
        section: session.section,
        term: session.term,
        taList: session.taList,
      }
      // post data back
      Post(postCreateCourse(), dataToSend).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            // update user and group list
            var newGroups = user?.groups;
            newGroups?.push(res.data.id)
            setUser(({ ...user, groups: newGroups }) as UserType)
            localStorage.setItem("papyrusai_user", JSON.stringify({ ...user, groups: newGroups }));
            //redirect to course list
            navigator("/courses");
            // pop up notifying user of creation
            setAlert({ message: "Course Created", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
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
      <Modal
        isOpen={openDiscardModal}
        title={"Discard Changes?"}
        onRequestClose={() => setOpenDiscardModal(false)}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={() => navigator(-1)}>
              Discard
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDiscardModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to discard the changes to this course?</div>
      </Modal>
      <div className="courses__section-header">
        <h3>Create Course</h3>
        <div>
          <ButtonGroup
            variant="contained"
            ref={anchorRefSave}
            aria-label="Button group with a nested menu"
          >
            <Button onClick={handleClick}>{options[selectedIndexSave]}</Button>
            <Button
              size="small"
              aria-controls={openSave ? 'split-button-menu' : undefined}
              aria-expanded={openSave ? 'true' : undefined}
              aria-label="select save and ativation strategy"
              aria-haspopup="menu"
              onClick={handleToggle}
            >
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>
          <Popper
            sx={{
              zIndex: 1,
            }}
            open={openSave}
            anchorEl={anchorRefSave.current}
            role={undefined}
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={handleClose}>
                    <MenuList id="split-button-menu" autoFocusItem>
                      {options.map((option, index) => (
                        <MenuItem
                          key={option}
                          selected={index === selectedIndexSave}
                          onClick={(event) => handleMenuItemClick(event, index)}
                          className={index === 2 ? "courses__discard_background" : ""}
                        >
                          {option}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </div>
      </div>
      <hr />
      <span>* indicates a required field</span>
      <Box className="courses__add">
        <form onSubmit={(e) => handleSubmit(e, true)}>
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
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}