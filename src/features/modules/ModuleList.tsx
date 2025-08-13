import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../../components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { CourseType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";
import { CustomUserType, UserStarred } from "../../utility/types/UserTypes";
import Get from "../../utility/Get";
import {
  getCourseList,
  putCopyModule,
} from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import Put from "../../utility/Put";
import { Checkbox } from "../../components/Checkbox";
import CourseCard from "../../components/CourseCard";
import {
  orderCourseRecentlyCreatedAndStarred,
  orderModuleRecentlyCreatedAndStarred,
} from "../../utility/Helpers";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../../utility/endpoints/UserEndpoints";
import { Star, Play, Eye, Copy, Edit } from "lucide-react";
import Post from "../../utility/Post";
import { cn } from "../../lib/utils";

interface ModuleListProps {
  course: CourseType;
  starredList: UserStarred | undefined;
  refreshList: () => void;
}

export default function ModuleList({
  course,
  starredList,
  refreshList,
}: ModuleListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [starredCourses, setStarredCourses] = useState<
    Array<{ courseId: string }>
  >([]);
  const [starredModules, setStarredModules] = useState<
    Array<{ courseId: string; moduleId: string }>
  >([]);
  const [openCourseListModal, setOpenCourseListModal] =
    useState<boolean>(false);
  const [openDuplicateModal, setOpenDuplicateModal] = useState<{
    courseId: string;
    moduleId: string;
    copyCourseId: string;
  }>({
    courseId: "",
    moduleId: "",
    copyCourseId: "",
  });
  const [duplicateModuleData, setDuplicateModuleData] = useState<{
    name: string;
    isPublished: boolean;
  }>({
    name: "",
    isPublished: false,
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
    if (
      (user?.groups.includes(
        process.env.REACT_APP_ADMIN
          ? process.env.REACT_APP_ADMIN
          : "PapyrusAIAdmin"
      ) ||
        user?.groups.includes(
          process.env.REACT_APP_INSTRUCTOR
            ? process.env.REACT_APP_INSTRUCTOR
            : "PapyrusAIInstructors"
        ) ||
        user?.groups.includes(course.id + "-TA")) &&
      openCourseListModal
    ) {
      getCourses(controller.signal);
    }
    return () => {
      controller.abort();
    };
  }, [user, course, openCourseListModal]);

  function getCourses(signal: AbortSignal) {
    setIsLoading(true);
    Get(getCourseList(), signal).then((res) => {
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
          setAlert({
            message: "No Courses Found. Cannot copy module.",
            type: "error",
          });
          setIsLoading(false);
        }
      }
    });
  }

  function handleCopyModuleTo() {
    setIsLoading(true);
    Put(
      putCopyModule(
        openDuplicateModal.courseId,
        openDuplicateModal.moduleId,
        openDuplicateModal.copyCourseId
      ),
      duplicateModuleData
    ).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          setOpenCourseListModal(false);
          setAlert({
            message: "Module copied to course",
            type: "success",
          });
          setDuplicateModuleData({
            name: "",
            isPublished: false,
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: res.data, type: "error" });
      }
      setOpenDuplicateModal({
        courseId: "",
        moduleId: "",
        copyCourseId: "",
      });
      refreshList();
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDuplicateModuleData({
      ...duplicateModuleData,
      [e.target.name]: e.target.value,
    });
  }

  function createStarredModule(courseId: string, moduleId: string) {
    setIsLoading(true);
    Post(postCreateUserFavoritingData(), {
      id: { courseId: courseId, moduleId: moduleId },
      type: "modules",
    }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.modules) {
          setStarredModules(res.data.modules);
          setAlert({
            message: "Module added to favorites.",
            type: "info",
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: res.data, type: "error" });
      }
    });
  }

  function removeStarredModule(courseId: string, moduleId: string) {
    setIsLoading(true);
    Put(putUpdateUserFavoritingData(), {
      id: { courseId: courseId, moduleId: moduleId },
      type: "modules",
    }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.modules) {
          setStarredModules(res.data.modules);
          setAlert({
            message: "Module removed from favorites.",
            type: "info",
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: res.data, type: "error" });
      }
    });
  }

  return course.modules.length > 0 ? (
    <section>
      <Dialog open={openCourseListModal} onOpenChange={setOpenCourseListModal}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Copy Module To?</DialogTitle>
            <DialogDescription>
              Please select a course you would like to copy this module to.
              Copying a module will copy over all module customizations,
              including the module name, description, added assets, and
              settings.
            </DialogDescription>
          </DialogHeader>
          <section
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="list"
            aria-label="Available courses"
          >
            {orderCourseRecentlyCreatedAndStarred(
              courseList,
              starredCourses
            ).map((course) => (
              <div key={course.id} role="listitem">
                <CourseCard
                  course={course}
                  refreshList={refreshList}
                  onClick={(courseId: string) => {
                    setOpenCourseListModal(false);
                    setOpenDuplicateModal((prev) => ({
                      ...prev,
                      copyCourseId: courseId,
                    }));
                  }}
                  isStarred={starredCourses.some(
                    (c) => c.courseId === course.id
                  )}
                />
              </div>
            ))}
          </section>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenCourseListModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDuplicateModal.copyCourseId !== ""}
        onOpenChange={(open) =>
          !open &&
          setOpenDuplicateModal({
            courseId: "",
            moduleId: "",
            copyCourseId: "",
          })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Module</DialogTitle>
            <DialogDescription>
              Please enter a unique name for your module. Duplicating the module
              will also copy over all settings within this module.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCopyModuleTo();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="module-name">Module Name</Label>
              <Input
                id="module-name"
                name="name"
                placeholder="New Module Name"
                value={duplicateModuleData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <Checkbox
              onClick={() => {
                setDuplicateModuleData((prev) => ({
                  ...prev,
                  isPublished: !duplicateModuleData.isPublished,
                }));
              }}
              checked={duplicateModuleData.isPublished}
              isDisabled={isLoading}
            >
              <span>Publish Module</span>
            </Checkbox>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setOpenDuplicateModal({
                    courseId: "",
                    moduleId: "",
                    copyCourseId: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Duplicate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4" role="list" aria-label="Module list">
        {orderModuleRecentlyCreatedAndStarred(
          course.modules,
          starredModules
        ).map((module, index) => {
          const isStarred = starredModules.some(
            (m) => m.moduleId === module.id
          );
          const courseInfo = `${course.name} - ${course.instructor.name} ${course.instructor.family_name}`;

          return (
            <div
              key={index}
              className="group bg-card border rounded-xl hover-lift shadow-sm relative"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
                <Play size={64} className="transform rotate-12" />
              </div>

              {/* Mobile Layout */}
              <div className="block md:hidden">
                <div className="p-3">
                  {/* Header with title and favorite */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                        {module.name}
                      </h3>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e: any) => {
                              e.stopPropagation();
                              isStarred
                                ? removeStarredModule(course.id, module.id)
                                : createStarredModule(course.id, module.id);
                            }}
                            disabled={isLoading}
                            className={cn(
                              "p-1.5 rounded-full ml-2 flex-shrink-0",
                              isStarred
                                ? "text-gold hover:text-muted"
                                : "text-muted hover:text-gold"
                            )}
                          >
                            <Star
                              size={14}
                              fill={isStarred ? "currentColor" : "none"}
                              className={cn(
                                isStarred
                                  ? "hover:fill-none"
                                  : "hover:fill-current"
                              )}
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="">
                          {isStarred ? "Unstar Module" : "Star Module"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Course info */}
                  <p className="text-xs text-muted-foreground mb-2 font-medium leading-relaxed">
                    {courseInfo}
                  </p>

                  {/* Description */}
                  {module.moduleDescription && (
                    <p className="text-muted-foreground leading-relaxed text-sm mb-3">
                      {module.moduleDescription}
                    </p>
                  )}

                  {/* Actions row */}
                  <div className="flex items-center justify-between">
                    {/* Secondary actions */}
                    <div className="flex items-center gap-1">
                      {(user?.groups.includes(
                        process.env.REACT_APP_ADMIN
                          ? process.env.REACT_APP_ADMIN
                          : "PapyrusAIAdmin"
                      ) ||
                        user?.groups.includes(
                          process.env.REACT_APP_INSTRUCTOR
                            ? process.env.REACT_APP_INSTRUCTOR
                            : "PapyrusAIInstructors"
                        ) ||
                        user?.groups.includes(course.id + "-TA")) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  navigator(
                                    `/dashboard/${course.id}/${module.id}`
                                  )
                                }
                                className="p-1.5 text-muted hover:text-muted-foreground hover:bg-muted rounded-lg transition-all duration-300"
                              >
                                <Eye size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="">
                              View Reports
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {(user?.groups.includes(
                        process.env.REACT_APP_ADMIN
                          ? process.env.REACT_APP_ADMIN
                          : "PapyrusAIAdmin"
                      ) ||
                        user?.groups.includes(
                          process.env.REACT_APP_INSTRUCTOR
                            ? process.env.REACT_APP_INSTRUCTOR
                            : "PapyrusAIInstructors"
                        ) ||
                        user?.groups.includes(course.id + "-TA")) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  setOpenDuplicateModal({
                                    courseId: course.id,
                                    moduleId: module.id,
                                    copyCourseId: "",
                                  });
                                  setOpenCourseListModal(true);
                                }}
                                className="p-1.5 text-muted hover:text-muted-foreground hover:bg-muted rounded-lg transition-all duration-300"
                              >
                                <Copy size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="">
                              Copy Module
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {(user?.groups.includes(
                        process.env.REACT_APP_INSTRUCTOR
                          ? process.env.REACT_APP_INSTRUCTOR
                          : "PapyrusAIInstructors"
                      ) ||
                        user?.groups.includes(course.id + "-TA")) &&
                        user?.groups.includes(course.id) &&
                        (course.instructor.username === user.username ||
                          (course.taList &&
                            course.taList.find(
                              (a: CustomUserType) =>
                                a.username === user?.username
                            ))) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    navigator(
                                      `/courses/${course.id}/editmodule/${module.id}`
                                    )
                                  }
                                  className="p-1.5 text-muted hover:text-muted-foreground hover:bg-muted rounded-lg transition-all duration-300"
                                >
                                  <Edit size={14} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="">
                                Edit Module
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                    </div>

                    {/* Primary action */}
                    <Button
                      onClick={() =>
                        navigator(`/courses/${course.id}/modules/${module.id}`)
                      }
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Play size={14} />
                      Begin
                    </Button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className="p-4">
                  <div className="relative flex items-start justify-between">
                    <div className="absolute top-0 right-0 w-16 h-16 opacity-5">
                      <Play size={64} className="transform rotate-12" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                          {module.name}
                        </h3>
                      </div>

                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        {courseInfo}
                      </p>
                      {module.moduleDescription && (
                        <p className="text-muted-foreground leading-relaxed text-sm">
                          {module.moduleDescription}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e: any) => {
                                e.stopPropagation();
                                isStarred
                                  ? removeStarredModule(course.id, module.id)
                                  : createStarredModule(course.id, module.id);
                              }}
                              disabled={isLoading}
                              className={cn(
                                "p-1.5 rounded-full",
                                isStarred
                                  ? "text-gold hover:text-muted"
                                  : "text-muted hover:text-gold"
                              )}
                            >
                              <Star
                                size={12}
                                fill={isStarred ? "currentColor" : "none"}
                                className={cn(
                                  isStarred
                                    ? "hover:fill-none"
                                    : "hover:fill-current"
                                )}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="">
                            {isStarred ? "Unstar Module" : "Star Module"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {(user?.groups.includes(
                        process.env.REACT_APP_ADMIN
                          ? process.env.REACT_APP_ADMIN
                          : "PapyrusAIAdmin"
                      ) ||
                        user?.groups.includes(
                          process.env.REACT_APP_INSTRUCTOR
                            ? process.env.REACT_APP_INSTRUCTOR
                            : "PapyrusAIInstructors"
                        ) ||
                        user?.groups.includes(course.id + "-TA")) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  navigator(
                                    `/dashboard/${course.id}/${module.id}`
                                  )
                                }
                                className="p-1.5 text-muted hover:text-muted-foreground hover:bg-muted rounded-full transition-all duration-300"
                              >
                                <Eye size={12} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="">
                              View Reports
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {(user?.groups.includes(
                        process.env.REACT_APP_ADMIN
                          ? process.env.REACT_APP_ADMIN
                          : "PapyrusAIAdmin"
                      ) ||
                        user?.groups.includes(
                          process.env.REACT_APP_INSTRUCTOR
                            ? process.env.REACT_APP_INSTRUCTOR
                            : "PapyrusAIInstructors"
                        ) ||
                        user?.groups.includes(course.id + "-TA")) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  setOpenDuplicateModal({
                                    courseId: course.id,
                                    moduleId: module.id,
                                    copyCourseId: "",
                                  });
                                  setOpenCourseListModal(true);
                                }}
                                className="p-1.5 text-muted hover:text-muted-foreground hover:bg-muted rounded-full transition-all duration-300"
                              >
                                <Copy size={12} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="">
                              Copy Module
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {(user?.groups.includes(
                        process.env.REACT_APP_INSTRUCTOR
                          ? process.env.REACT_APP_INSTRUCTOR
                          : "PapyrusAIInstructors"
                      ) ||
                        user?.groups.includes(course.id + "-TA")) &&
                        user?.groups.includes(course.id) &&
                        (course.instructor.username === user.username ||
                          (course.taList &&
                            course.taList.find(
                              (a: CustomUserType) =>
                                a.username === user?.username
                            ))) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() =>
                                    navigator(
                                      `/courses/${course.id}/editmodule/${module.id}`
                                    )
                                  }
                                  className="p-1.5 text-muted hover:text-muted-foreground hover:bg-muted rounded-full transition-all duration-300"
                                >
                                  <Edit size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="">
                                Edit Module
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                      <Button
                        onClick={() =>
                          navigator(
                            `/courses/${course.id}/modules/${module.id}`
                          )
                        }
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2 ml-2"
                      >
                        <Play size={14} />
                        Begin Module
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  ) : (
    <div className="text-center py-8 text-muted-foreground" role="status">
      <p className="mb-2">No modules are currently available to you.</p>
      {user?.groups.includes(
        process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors"
      ) && (
        <p>
          To create a module, go to the course in which you would like to create
          the module.
        </p>
      )}
    </div>
  );
}
