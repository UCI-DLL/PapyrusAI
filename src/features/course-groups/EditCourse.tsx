import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Separator } from "../../components/ui/separator";
import { Trash2, ChevronDown, Info, Plus, Loader2, Users, GraduationCap, Save, CheckCircle, XCircle, UserPlus } from "lucide-react";
import Get from "../../utility/Get";
import { getCourse, putUpdateCourse } from "../../utility/endpoints/CourseEndpoints";
import Put from "../../utility/Put";
import { CourseType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { CustomUserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { getUserList } from "../../utility/endpoints/UserEndpoints";
import { cn } from "../../lib/utils";
// Temporary Material-UI imports during conversion
import {
  TextField,
  FormLabel,
  Box,
  LinearProgress,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  Tooltip,
  IconButton,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Select as MuiSelect
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import InfoIcon from '@mui/icons-material/Info';
import { Modal } from "../../components/Modal";

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

const options = ['Save & Publish', 'Save without Publishing', 'Discard Changes'];

export default function EditCourse(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditCourseType>({
    name: "",
    signUpCode: "",
    isDeleted: false, //prev from backend
    isActive: false, //prev from backend
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
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openActiveModal, setOpenActiveModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] = useState<boolean>(false);

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

  function handleClick(e: any) {
    if (selectedIndexSave === 0) { //Save and publish
      handleSubmit(e, true, false);
    } else if (selectedIndexSave === 1) { //save and not publish
      if (session.isActive) { //handle case that course is already active and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (selectedIndexSave === 2) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and publish
      handleSubmit(e, true, false);
    } else if (index === 1) { //save and not publish
      if (session.isActive) { //handle case that course is already active and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
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


  function handleSubmit(e: any, isActive = false, isDeleted = false) {
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
            isActive: isActive,
            isDeleted: isDeleted,
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
            } else if (res && res.status === 401) {
              navigator("/login");
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
        isOpen={showSavePublishTooltip}
        title={"What is Save & Publish?"}
        onRequestClose={() => setShowSavePublishTooltip(false)}
        actions={
          <>
            <Button variant="default" onClick={() => setShowSavePublishTooltip(false)}>
              Close
            </Button>
          </>
        }
      >
        <div>
          To save and publish (i.e., make visible to students) your course, select “Save & Publish”.
          If you want to save your course without publishing the course, select “Save without Publishing”.
          <span style={{ fontStyle: "italic" }}> Note: Choosing this option after the course has already been published will unpublish the course.</span>
        </div>
      </Modal>
      <Modal
        isOpen={openDeleteModal}
        title={"Delete Course?"}
        onRequestClose={() => setOpenDeleteModal(false)}
        actions={
          <>
            <Button variant="default" color="error" onClick={(e) => handleSubmit(e, false, true)}>
              Delete
            </Button>
            <Button variant="default" color="secondary" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to permanently delete this course?</div>
      </Modal>
      <Modal
        isOpen={openDiscardModal}
        title={"Discard Changes?"}
        onRequestClose={() => setOpenDiscardModal(false)}
        actions={
          <>
            <Button variant="default" color="primary" onClick={() => navigator(-1)}>
              Discard
            </Button>
            <Button variant="default" color="secondary" onClick={() => setOpenDiscardModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to discard the changes to this course?</div>
      </Modal>
      <Modal
        isOpen={openActiveModal}
        title={"Unpublish Course?"}
        onRequestClose={() => setOpenActiveModal(false)}
        actions={
          <>
            <Button variant="default" color="primary" onClick={(e) => handleSubmit(e, false, false)}>
              Continue
            </Button>
            <Button variant="default" color="secondary" onClick={() => setOpenActiveModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>This course is current published and available to the public. Continuing will make the course unavailable to students.</div>
      </Modal>
      {!error && prevSession ? (
        <>
          <div className="courses__section-header">
            <h3>Edit {prevSession.name}</h3>
            <div>
              <Tooltip
                title={"Delete"}
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: '#da0222', //error color
                      '& .MuiTooltip-arrow': {
                        color: '#da0222',
                      },
                    },
                  },
                }}
              >
                <IconButton
                  onClick={() => setOpenDeleteModal(true)}
                  aria-label="Delete Course"
                  className="courses__delete_background"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              &nbsp;&nbsp;&nbsp;
              <div className="form-tooltips">
                <button onClick={() => setShowSavePublishTooltip(true)}>
                  <InfoIcon />
                </button>
                <ButtonGroup
                  variant="contained"
                  ref={anchorRefSave}
                  aria-label="Button group with a nested menu"
                >
                  <Button onClick={handleClick}>{options[selectedIndexSave]}</Button>
                  <Button
                    size="sm"
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
          </div>
          <div>
            Courses are spaces in which instructors can create and organize modules that customize how students can interact with the AI.
            For more information on editing a course, please see the <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.1pkdik3iscqd"
              target="_blank" rel="noreferrer">“Editing a Course” section of our instructor guide
            </a>.
          </div>
          <hr />
          <div className="courses__section-header">
            <span>* indicates a required field</span>
            <div>
              {session.isActive ? (
                <>
                  <TaskAltIcon color="success" />
                  &nbsp;Published
                </>
              ) : (
                <>
                  <DoNotDisturbIcon />
                  &nbsp;Unpublished
                </>
              )}

            </div>
          </div>

          <Box className="courses__add">
            <form onSubmit={(e) => handleSubmit(e, true, false)}>
              <FormLabel>Enter Course Information</FormLabel>
              <div className="form-tooltips">
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
                <Tooltip title="The name for your course that users will see upon joining." enterTouchDelay={0}>
                  <InfoIcon />
                </Tooltip>
              </div>
              <div className="form-tooltips">
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
                <Tooltip
                  title="The unique sign up code that users will use to join your course. You can use any combination of letters and numbers. This is case sensitive."
                  enterTouchDelay={0}
                >
                  <InfoIcon />
                </Tooltip>
              </div>
              <div className="form-tooltips">
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
                <Tooltip title="The year in which your course is taking place." enterTouchDelay={0}>
                  <InfoIcon />
                </Tooltip>
              </div>
              <div className="form-tooltips">
                <FormControl fullWidth>
                  <InputLabel id="select-term">Term</InputLabel>
                  <MuiSelect
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
                  </MuiSelect>
                </FormControl>
                <Tooltip title="The term in which your course is taking place." enterTouchDelay={0}>
                  <InfoIcon />
                </Tooltip>
              </div>
              <div className="form-tooltips">
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
                <Tooltip title="The section number or period for your course." enterTouchDelay={0}>
                  <InfoIcon />
                </Tooltip>
              </div>
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
              <span>
                The name and email address of the teaching assistant(s) assigned to your course. Teaching assistants can
                create and edit modules for you, but not delete or unpublish the course. You can assign multiple people to this role.
                <span style={{ fontStyle: "italic" }}> In order to add someone as a teaching assistant, they must already have a PapyrusAI account.</span>
              </span>
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