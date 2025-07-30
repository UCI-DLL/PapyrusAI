import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Input } from "../../components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
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
  starredList: UserStarred | undefined;
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
    courseId: string,
    moduleId: string,
    copyCourseId: string
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
    if ((user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
      user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
      user?.groups.includes(course.id + "-TA")) && openCourseListModal) {
      getCourses(controller.signal)
    }
    return () => {
      controller.abort();
    };
  }, [user, course, openCourseListModal])

  function getCourses(signal: AbortSignal) {
    setIsLoading(true);
    Get(getCourseList(), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          setCourseList(res.data);
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
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
          setStarredModules(res.data.modules)
          setAlert({ message: "Module added to favorites.", type: "info" })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
          setAlert({ message: res.data, type: "error" })
      }
    });
  }

  function removeStarredModule(courseId: string, moduleId: string) {
    setIsLoading(true)
    Put(putUpdateUserFavoritingData(), { id: { courseId: courseId, moduleId: moduleId }, type: "modules" }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.modules) {
          setStarredModules(res.data.modules)
          setAlert({ message: "Module removed from favorites.", type: "info" })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
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
              variant="secondary"
              onClick={() => setOpenCourseListModal(false)}>
              Close
            </Button>
          </>
        }
      >
        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            Please select a course you would like to copy this module to.
            Copying a module will copy over all module customizations, including the module name,
            description, added assets, and settings.
          </div>
          <div className="courses__list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              onClick={(e) => {
                handleCopyModuleTo()
              }}
            >
              Duplicate
            </Button>
            <Button
              variant="secondary"
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
          <div className="mb-4 text-sm text-muted-foreground">Please enter a unique name for your module. Duplicating the module will also copy over all settings within this module.</div>
          <Input
            name="name"
            placeholder="New Module Name"
            className="mb-4"
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
        </div>
      </Modal>
      <div className="bg-card rounded-lg border">
        {orderModuleRecentlyCreatedAndStarred(course.modules, starredModules).map((module, index) => {
          return (
            <div key={index}>
              <div className="flex items-center justify-between p-4">
                <button onClick={() => navigator(`/courses/${course.id}/modules/${module.id}`)} className="text-left flex-1">
                  <div className="font-medium">{module.name}</div>
                  <div className="text-sm text-muted-foreground">{course.name + " - " + course.instructor.name + " " + course.instructor.family_name}</div>
                  <div className="text-sm text-muted-foreground mt-1">{module.moduleDescription}</div>
                </button>
                <div className="flex items-center gap-2">
                  {
                    starredModules.some(m => m.moduleId === module.id) ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!isLoading}
                            onClick={(e: any) => {
                              e.stopPropagation()
                              removeStarredModule(course.id, module.id)
                            }}
                          >
                            <StarIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Unstar Module</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!isLoading}
                            onClick={(e: any) => {
                              e.stopPropagation()
                              createStarredModule(course.id, module.id)
                            }}
                          >
                            <StarBorderIcon />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Star Module</TooltipContent>
                      </Tooltip>
                    )
                  }

                  {(user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
                    user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
                    user?.groups.includes(course.id + "-TA")) && (
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator(`/dashboard/${course.id}/${module.id}`)
                      }}>
                        View
                      </Button>
                    )}
                  {(user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
                    user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
                    user?.groups.includes(course.id + "-TA")) && (
                      <Button variant="outline" size="sm" onClick={() => {
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
                    user?.groups.includes(course.id + "-TA")
                  ) &&
                    user?.groups.includes(course.id) &&
                    (course.instructor.username === user.username || (
                      course.taList &&
                      course.taList.find((a: CustomUserType) => a.username === user?.username)
                    )) ? (
                    <Button variant="outline" size="sm" onClick={() => navigator(`/courses/${course.id}/editmodule/${module.id}`)}>Edit</Button>
                  ) : <></>}
                  <Button size="sm" onClick={() => navigator(`/courses/${course.id}/modules/${module.id}`)}>Begin Module</Button>
                </div>
              </div>
              {index !== course.modules.length - 1 ? (
                <Separator />
              ) : <></>}
            </div>
          )
        })}
      </div>
    </div>
  ) : (
    <div className="text-center py-8 text-muted-foreground">
      <p className="mb-2">No modules are currently available to you.</p>
      {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ?
        <p>To create a module, go to the course in which you would like to create the module.</p> :
        ""}
    </div>
  )
}