import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
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
import { Checkbox } from "../../components/ui/checkbox";
import CourseCard from "../../components/CourseCard";
import ModuleCard from "../../components/ModuleCard";
import {
  orderCourseRecentlyCreatedAndStarred,
  orderModuleRecentlyCreatedAndStarred,
} from "../../utility/Helpers";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../../utility/endpoints/UserEndpoints";
import { Star, Play, Copy, Edit, Loader2 } from "lucide-react";
import Post from "../../utility/Post";
import { cn } from "../../lib/utils";
import {
  getConversationList,
  postCreateConversation,
} from "../../utility/endpoints/ConversationEndpoints";

interface ModuleListProps {
  course: CourseType;
  starredList: UserStarred | undefined;
  refreshList: () => void;
  viewMode?: "list" | "card";
}

export default function ModuleList({
  course,
  starredList,
  refreshList,
  viewMode = "list",
}: ModuleListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNavigatingToModule, setIsNavigatingToModule] = useState<
    string | null
  >(null);
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
  }, [user, course, openCourseListModal]); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleBeginModule(courseId: string, moduleId: string) {
    if (!user) return;

    const moduleKey = `${courseId}-${moduleId}`;
    setIsNavigatingToModule(moduleKey);

    try {
      // First, get the conversation list for this module
      const conversationRes = await Get(
        getConversationList(courseId, moduleId)
      );

      if (
        conversationRes &&
        conversationRes.status &&
        conversationRes.status < 300
      ) {
        if (
          conversationRes.data &&
          conversationRes.data.conversations &&
          conversationRes.data.conversations.length > 0
        ) {
          // Sort conversations by ID (latest first) and get the latest one
          const sortedConversations = conversationRes.data.conversations.sort(
            (a: any, b: any) => parseInt(b.id) - parseInt(a.id)
          );
          const latestConversationIndex =
            conversationRes.data.conversations.length -
            conversationRes.data.conversations.findIndex(
              (conv: any) => conv.id === sortedConversations[0].id
            ) -
            1;

          // Navigate to the latest conversation
          navigator(
            `/chat/${user.username}/${courseId}/${moduleId}/${latestConversationIndex}`
          );
        } else {
          // No conversations exist, create a new one
          const createRes = await Post(
            postCreateConversation(courseId, moduleId),
            {}
          );

          if (createRes && createRes.status && createRes.status < 300) {
            if (createRes.data && createRes.data.conversations) {
              // Navigate to the newly created conversation
              navigator(
                `/chat/${user.username}/${courseId}/${moduleId}/${createRes.data.conversations.length - 1
                }`
              );
            }
          } else if (createRes && createRes.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message:
                "Something went wrong creating a new conversation. Try again later",
              type: "error",
            });
          }
        }
      } else if (conversationRes && conversationRes.status === 401) {
        navigator("/login");
      } else {
        setAlert({
          message:
            "Something went wrong loading conversations. Try again later",
          type: "error",
        });
      }
    } catch (error) {
      setAlert({
        message: "Something went wrong. Try again later",
        type: "error",
      });
    } finally {
      setIsNavigatingToModule(null);
    }
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
            type: "success",
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to star module", type: "error" });
      }
      setIsLoading(false);
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
            type: "success",
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to unstar module", type: "error" });
      }
      setIsLoading(false);
    });
  }

  return course.modules.length > 0 ? (
    <section>
      {viewMode === "card" && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          role="list"
          aria-label="Module cards"
        >
          {orderModuleRecentlyCreatedAndStarred(
            course.modules,
            starredModules
          ).map((module, index) => (
            <div key={index} role="listitem">
              <ModuleCard
                module={module}
                course={course}
                refreshList={refreshList}
                starredList={starredList}
              />
            </div>
          ))}
        </div>
      )}

      {viewMode === "list" && (
        <>
          <DialogWrapper
            open={openCourseListModal}
            onOpenChange={setOpenCourseListModal}
            title="Copy Module To?"
            description="Please select a course you would like to copy this module to. Copying a module will copy over all module customizations, including the module name, description, added assets, and settings."
            contentClassName="sm:max-w-5xl max-h-[90vh] overflow-y-auto"
            actions={[
              {
                label: "Close",
                onClick: () => setOpenCourseListModal(false),
                variant: "outline",
              },
            ]}
          >
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
          </DialogWrapper>

          <DialogWrapper
            open={openDuplicateModal.copyCourseId !== ""}
            onOpenChange={(open) =>
              !open &&
              setOpenDuplicateModal({
                courseId: "",
                moduleId: "",
                copyCourseId: "",
              })
            }
            title="Duplicate Module"
            description="Please enter a unique name for your module. Duplicating the module will also copy over all settings within this module."
            contentClassName="sm:max-w-md"
            showFooter={false}
          >
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="publish-module"
                  checked={duplicateModuleData.isPublished}
                  onCheckedChange={(checked) => {
                    setDuplicateModuleData((prev) => ({
                      ...prev,
                      isPublished: checked === true,
                    }));
                  }}
                  disabled={isLoading}
                />
                <label
                  htmlFor="publish-module"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Publish Module
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-4">
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
              </div>
            </form>
          </DialogWrapper>

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
                  role="listitem"
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
                          <h2 className="text-xl font-bold text-foreground group-hover:text-primary dark:group-hover:text-gold 
                          colorful-dark:group-hover:text-gold transition-colors duration-300 leading-tight">
                            {module.name}
                          </h2>
                        </div>
                        <TooltipWrapper
                          content={isStarred ? "Unstar Module" : "Star Module"}
                        >
                          <button
                            onClick={(e: any) => {
                              e.stopPropagation();
                              isStarred
                                ? removeStarredModule(course.id, module.id)
                                : createStarredModule(course.id, module.id);
                            }}
                            disabled={isLoading}
                            className={cn(
                              "p-1.5 text-lg rounded-full ml-2 flex-shrink-0",
                              isStarred
                                ? "text-gold hover:text-muted"
                                : "text-muted hover:text-gold"
                            )}
                            aria-label={isStarred ? "Unstar Module" : "Star Module"}
                          >
                            <Star
                              size={12}
                              fill={isStarred ? "currentColor" : "none"}
                              className={cn(
                                isStarred
                                  ? "hover:fill-none h-[1em] w-[1em]"
                                  : "hover:fill-current h-[1em] w-[1em]"
                              )}
                            />
                          </button>
                        </TooltipWrapper>
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
                          {/* {(user?.groups.includes(
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
                              <TooltipWrapper content="View Reports">
                                <button
                                  onClick={() =>
                                    navigator(
                                      `/dashboard/${course.id}/${module.id}`
                                    )
                                  }
                                  className="p-1.5 text-primary hover:text-primary-foreground hover:bg-accent rounded-lg transition-all duration-300"
                                >
                                  <Eye size={14} />
                                </button>
                              </TooltipWrapper>
                            )} */}

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
                              <TooltipWrapper content="Copy Module">
                                <button
                                  onClick={() => {
                                    setOpenDuplicateModal({
                                      courseId: course.id,
                                      moduleId: module.id,
                                      copyCourseId: "",
                                    });
                                    setOpenCourseListModal(true);
                                  }}
                                  className="p-1.5 text-lg text-primary hover:text-primary-foreground hover:bg-accent rounded-lg transition-all duration-300"
                                  aria-label="Copy Module"
                                >
                                  <Copy className="h-[1em] w-[1em]" />
                                </button>
                              </TooltipWrapper>
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
                              <TooltipWrapper content="Edit Module">
                                <button
                                  onClick={() =>
                                    navigator(
                                      `/courses/${course.id}/editmodule/${module.id}`
                                    )
                                  }
                                  aria-label="Edit Module"
                                  className="p-1.5 text-lg text-primary hover:text-primary-foreground hover:bg-accent rounded-lg transition-all duration-300"
                                >
                                  <Edit className="h-[1em] w-[1em]" />
                                </button>
                              </TooltipWrapper>
                            )}
                        </div>

                        {/* Primary action */}
                        <Button
                          onClick={() =>
                            navigator(
                              `/courses/${course.id}/modules/${module.id}`
                            )
                          }
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2"
                          aria-label="Begin Module"
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
                            <h2 className="text-xl font-bold text-foreground group-hover:text-primary dark:group-hover:text-gold 
                            colorful-dark:group-hover:text-gold transition-colors duration-300 truncate-text">
                              {module.name}
                            </h2>
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
                          <TooltipWrapper
                            content={
                              isStarred ? "Unstar Module" : "Star Module"
                            }
                          >
                            <button
                              onClick={(e: any) => {
                                e.stopPropagation();
                                isStarred
                                  ? removeStarredModule(course.id, module.id)
                                  : createStarredModule(course.id, module.id);
                              }}
                              disabled={isLoading}
                              className={cn(
                                "p-1.5 rounded-full text-lg",
                                isStarred
                                  ? "text-gold hover:text-muted"
                                  : "text-muted hover:text-gold"
                              )}
                              aria-label={isStarred ? "Unstar Module" : "Star Module"}
                            >
                              <Star
                                size={12}
                                fill={isStarred ? "currentColor" : "none"}
                                className={cn(
                                  isStarred
                                    ? "hover:fill-none h-[1em] w-[1em]"
                                    : "hover:fill-current h-[1em] w-[1em]"
                                )}
                              />
                            </button>
                          </TooltipWrapper>

                          {/* {(user?.groups.includes(
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
                              <TooltipWrapper content="View Reports">
                                <button
                                  onClick={() =>
                                    navigator(
                                      `/dashboard/${course.id}/${module.id}`
                                    )
                                  }
                                  className="p-1.5 text-primary hover:text-primary-foreground hover:bg-accent rounded-full transition-all duration-300"
                                >
                                  <Eye size={12} />
                                </button>
                              </TooltipWrapper>
                            )} */}

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
                              <TooltipWrapper content="Copy Module">
                                <button
                                  onClick={() => {
                                    setOpenDuplicateModal({
                                      courseId: course.id,
                                      moduleId: module.id,
                                      copyCourseId: "",
                                    });
                                    setOpenCourseListModal(true);
                                  }}
                                  className="p-1.5 text-lg text-primary hover:text-primary-foreground hover:bg-accent rounded-full transition-all duration-300"
                                  aria-label="Copy Module"
                                >
                                  <Copy className="h-[1em] w-[1em]" />
                                </button>
                              </TooltipWrapper>
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
                              <TooltipWrapper content="Edit Module">
                                <button
                                  onClick={() =>
                                    navigator(
                                      `/courses/${course.id}/editmodule/${module.id}`
                                    )
                                  }
                                  aria-label="Edit Module"
                                  className="p-1.5 text-lg text-primary hover:text-primary-foreground hover:bg-accent rounded-full transition-all duration-300"
                                >
                                  <Edit className="h-[1em] w-[1em]" />
                                </button>
                              </TooltipWrapper>
                            )}

                          <Button
                            onClick={() =>
                              handleBeginModule(course.id, module.id)
                            }
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2 ml-2"
                            disabled={
                              isNavigatingToModule ===
                              `${course.id}-${module.id}`
                            }
                          >
                            {isNavigatingToModule ===
                              `${course.id}-${module.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play size={14} />
                            )}
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
        </>
      )}
    </section>
  ) : (
    <div
      className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
      role="status"
    >
      <Play className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium mb-2">
        No modules are currently available to you.
      </p>
      {user?.groups.includes(
        process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors"
      ) && (
          <p className="text-sm">
            To create a module, go to the course in which you would like to create
            the module.
          </p>
        )}
    </div>
  );
}
