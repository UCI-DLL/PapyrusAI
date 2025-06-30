import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Divider, IconButton, List, ListItem, ListItemText, TextField, Tooltip } from "@mui/material";
import { CourseType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";
import { CustomUserType, UserStarred } from "../../utility/types/UserTypes";
import Get from "../../utility/Get";
import { getCourseList, putCopyModule } from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import Put from "../../utility/Put";
import { Modal } from "../../components/Modal";
import { Checkbox } from "../../components/Checkbox";
import CourseCard from "../../components/CourseCard";
import { orderCourseRecentlyCreatedAndStarred, orderModuleRecentlyCreatedAndStarred } from "../../utility/Helpers";
import { postCreateUserFavoritingData, putUpdateUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import Post from "../../utility/Post";

interface ModuleListProps {
  course: CourseType;
  starredList: UserStarred | undefined; //user favorited
  refreshList: () => void;
}

export default function ModuleList({ course, starredList, refreshList }: ModuleListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [starredCourses, setStarredCourses] = useState<Array<{ courseId: string }>>([]);
  const [starredModules, setStarredModules] = useState<Array<{ courseId: string, moduleId: string }>>([]);
  const [openCourseListModal, setOpenCourseListModal] = useState<boolean>(false);
  const [openDuplicateModal, setOpenDuplicateModal] = useState<{
    courseId: string, //current course
    moduleId: string, //currently selected module
    copyCourseId: string //course to copy module to 
  }>({
    courseId: "",
    moduleId: "",
    copyCourseId: ""
  });
  const [duplicateModuleData, setDuplicateModuleData] = useState<{
    name: string,
    isPublished: boolean
  }>({
    name: "",
    isPublished: false
  });
  const { setAlert } = useContext(AlertContext);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };

  useEffect(() => {
    if (starredList) {
      if (starredList.courses) {
        setStarredCourses(starredList.courses);
      }
      if (starredList.modules) {
        setStarredModules(starredList.modules);
      }
    }
  }, [starredList]);

  useEffect(() => {
    const controller = new AbortController();
    //if user is more than a normal user (permission-wise)
    if ((user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
      user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
      user?.groups.includes(course.id + "-TA")) && openCourseListModal) {
      getCourses(controller.signal)
    }
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [user, course, openCourseListModal])

  function getCourses(signal: AbortSignal) {
    setIsLoading(true);
    Get(getCourseList(), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //get the list of all courses for this user
          setCourseList(res.data);
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setAlert({ message: "No Courses Found. Cannot copy module.", type: "error" });
          setIsLoading(false);
        }
      }
    });
  }

  function handleCopyModuleTo() {
    setIsLoading(true);
    Put(putCopyModule(
      openDuplicateModal.courseId,
      openDuplicateModal.moduleId,
      openDuplicateModal.copyCourseId),
      duplicateModuleData
    ).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of Duplicated
          setOpenCourseListModal(false);
          setAlert({ message: "Module copied to course", type: "success" })
          setDuplicateModuleData({
            name: "",
            isPublished: false
          })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" })
      }
      setOpenDuplicateModal({
        courseId: "",
        moduleId: "",
        copyCourseId: ""
      });
      refreshList();
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDuplicateModuleData({ ...duplicateModuleData, [e.target.name]: e.target.value });
  }

  function createStarredModule(courseId: string, moduleId: string) {
    setIsLoading(true)
    Post(postCreateUserFavoritingData(), { id: { courseId: courseId, moduleId: moduleId }, type: "modules" }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.modules) {
          //update module lists as needed
          setStarredModules(res.data.modules)
          setAlert({ message: "Module added to favorites.", type: "info" })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" })
      }
    });
  }

  function removeStarredModule(courseId: string, moduleId: string) {
    setIsLoading(true)
    Put(putUpdateUserFavoritingData(), { id: { courseId: courseId, moduleId: moduleId }, type: "modules" }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.modules) {
          //update module lists as needed
          setStarredModules(res.data.modules)
          setAlert({ message: "Module removed from favorites.", type: "info" })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" })
      }
    });
  }

  return course.modules.length > 0 ? (
    <div className="modules__list">
      <Modal
        isOpen={openCourseListModal}
        title={"Copy Module To?"}
        onRequestClose={() => setOpenCourseListModal(false)}
        actions={
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenCourseListModal(false)}>
              Close
            </Button>
          </>
        }
      >
        <div>
          <div>
            Please select a course you would like to copy this module to.
            Copying a module will copy over all module customizations, including the module name,
            description, added assets, and settings.
          </div>
          <div className="courses__list">
            {orderCourseRecentlyCreatedAndStarred(courseList, starredCourses).map((course, index) => {
              return (
                <div key={index}>
                  <CourseCard
                    course={course}
                    keyy={index}
                    refreshList={refreshList}
                    onClick={(courseId: string) => {
                      setOpenCourseListModal(false);
                      setOpenDuplicateModal(prev => ({ ...prev, copyCourseId: courseId }));
                    }}
                    isStarred={starredCourses.some(c => c.courseId === course.id)}
                  />
                </div>
              )
            })}
          </div>
          &nbsp;
        </div>
      </Modal>
      <Modal
        isOpen={openDuplicateModal.copyCourseId !== ""}
        title={"Duplicate Module"}
        onRequestClose={() => setOpenDuplicateModal({
          courseId: "",
          moduleId: "",
          copyCourseId: ""
        })}
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                handleCopyModuleTo()
              }}
            >
              Duplicate
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenDuplicateModal({
                courseId: "",
                moduleId: "",
                copyCourseId: ""
              })}>
              Close
            </Button>
          </>
        }
      >
        <div>
          <div>Please enter a unique name for your module. Duplicating the module will also copy over all settings within this module.</div>
          <TextField
            name="name"
            label="New Module Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={duplicateModuleData.name}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <Checkbox
            onClick={() => {
              setDuplicateModuleData((prev) => ({
                ...prev,
                isPublished: !duplicateModuleData.isPublished
              }))
            }}
            checked={duplicateModuleData.isPublished}
            isDisabled={isLoading}
          >
            <span>
              Publish Module
            </span>
          </Checkbox>
          &nbsp;
        </div>
      </Modal>
      <List sx={style} aria-label="modules list">
        {orderModuleRecentlyCreatedAndStarred(course.modules, starredModules).map((module, index) => {
          return (
            <div key={index}>
              {/* button redirect to the conversation */}
              <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                <button onClick={() => navigator(`/courses/${course.id}/modules/${module.id}`)} style={{ textAlign: "left", width: "100%" }}>
                  <ListItemText primary={module.name} secondary={course.name + " - " + course.instructor.name + " " + course.instructor.family_name} />
                  <div>{module.moduleDescription}</div>
                </button>
                <div style={{ display: "flex" }}>
                  {
                    starredModules.some(m => m.moduleId === module.id) ? (
                      <Tooltip title={"Unstar Module"}>
                        <IconButton
                          className="courses__button__menu-btn"
                          aria-label="favorite course"
                          id={`${module.id}favorite-button`}
                          disabled={!isLoading}
                          onClick={(e: any) => {
                            e.stopPropagation()
                            removeStarredModule(course.id, module.id)
                          }}
                        >
                          <StarIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={"Star Module"}>
                        <IconButton
                          className="courses__button__menu-btn"
                          aria-label="favorite course"
                          id={`${module.id}favorite-button`}
                          disabled={!isLoading}
                          onClick={(e: any) => {
                            e.stopPropagation()
                            createStarredModule(course.id, module.id)
                          }}
                        >
                          <StarBorderIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }

                  {(user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
                    user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
                    user?.groups.includes(course.id + "-TA")) && (
                      <Button onClick={() => {
                        navigator(`/dashboard/${course.id}/${module.id}`)
                      }}>
                        View
                      </Button>
                    )}
                  {(user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
                    user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
                    user?.groups.includes(course.id + "-TA")) && (
                      <Button onClick={() => {
                        setOpenDuplicateModal({
                          courseId: course.id,
                          moduleId: module.id,
                          copyCourseId: ""
                        })
                        setOpenCourseListModal(true)
                      }}>
                        Copy
                      </Button>
                    )}
                  {(
                    user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
                    user?.groups.includes(course.id + "-TA") //handle tas
                  ) &&
                    user?.groups.includes(course.id) &&
                    (course.instructor.username === user.username || (
                      course.taList &&
                      course.taList.find((a: CustomUserType) => a.username === user?.username) //handle tas too
                    )) ? (
                    <Button onClick={() => navigator(`/courses/${course.id}/editmodule/${module.id}`)}>Edit</Button>
                  ) : <></>}
                  <Button variant="contained" onClick={() => navigator(`/courses/${course.id}/modules/${module.id}`)}>Begin Module</Button>
                </div>

              </ListItem>
              {index !== course.modules.length - 1 ? ( //only have dividers between modules
                <Divider />
              ) : <></>}
            </div>
          )
        })}
      </List>
    </div>
  ) : (
    <div>No modules are currently available to you.
      {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ?
        " To create a module, go to the course in which you would like to create the module." :
        ""}
    </div>
  )
}