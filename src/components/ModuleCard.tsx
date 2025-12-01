import { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { useNavigate } from "react-router-dom";
import { Star, Play, MoreHorizontal, Loader2, CheckCircle, XCircle } from "lucide-react";
import { UserContext } from "../utility/context/UserContext";
import { AlertContext } from "../utility/context/AlertContext";
import { CourseType, ModuleType } from "../utility/types/CourseTypes";
import { CustomUserType, UserStarred } from "../utility/types/UserTypes";
import Post from "../utility/Post";
import Put from "../utility/Put";
import Get from "../utility/Get";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import {
  getCourseList,
  putCopyModule,
} from "../utility/endpoints/CourseEndpoints";
import {
  getConversationList,
  postCreateConversation,
} from "../utility/endpoints/ConversationEndpoints";
import { cn } from "../lib/utils";
import { orderCourseRecentlyCreatedAndStarred } from "../utility/Helpers";
import CourseCard from "./CourseCard";
import { Badge } from "../components/ui/badge";

interface ModuleCardProps {
  module: ModuleType;
  course: CourseType;
  refreshList: () => void;
  starredList?: UserStarred;
}

export default function ModuleCard({
  module,
  course,
  refreshList,
  starredList,
}: ModuleCardProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNavigatingToModule, setIsNavigatingToModule] =
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
  const [starredModules, setStarredModules] = useState<
    Array<{ courseId: string; moduleId: string }>
  >([]);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [openCourseListModal, setOpenCourseListModal] =
    useState<boolean>(false);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [starredCourses, setStarredCourses] = useState<
    Array<{ courseId: string }>
  >([]);

  useEffect(() => {
    if (starredList && starredList.modules) {
      setStarredModules(starredList.modules);
    }
    if (starredList && starredList.courses) {
      setStarredCourses(starredList.courses);
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

  const isStarred = starredModules.some(
    (m) => m.moduleId === module.id && m.courseId === course.id
  );

  const courseInfo = `${course.name} - ${course.instructor.name} ${course.instructor.family_name}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDuplicateModuleData({
      ...duplicateModuleData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleBeginModule() {
    if (!user) return;

    setIsNavigatingToModule(true);

    try {
      // First, get the conversation list for this module
      const conversationRes = await Get(
        getConversationList(course.id, module.id)
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
            `/chat/${user.username}/${course.id}/${module.id}/${latestConversationIndex}`
          );
        } else {
          // No conversations exist, create a new one
          const createRes = await Post(
            postCreateConversation(course.id, module.id),
            {}
          );

          if (createRes && createRes.status && createRes.status < 300) {
            if (createRes.data && createRes.data.conversations) {
              // Navigate to the newly created conversation
              navigator(
                `/chat/${user.username}/${course.id}/${module.id}/${createRes.data.conversations.length - 1
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
      setIsNavigatingToModule(false);
    }
  }

  function createStarredModule() {
    setIsLoading(true);
    Post(postCreateUserFavoritingData(), {
      id: { courseId: course.id, moduleId: module.id },
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
      } else if (res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to star module", type: "error" });
      }
      setIsLoading(false);
    });
  }

  function removeStarredModule() {
    setIsLoading(true);
    Put(putUpdateUserFavoritingData(), {
      id: { courseId: course.id, moduleId: module.id },
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
      } else if (res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to unstar module", type: "error" });
      }
      setIsLoading(false);
    });
  }

  const ownerMenu = [
    {
      label: "Edit Module",
      type: "link" as const,
      action: `/courses/${course.id}/editmodule/${module.id}`,
    },
    {
      label: "Copy Module",
      type: "function" as const,
      action: () => {
        setOpenDuplicateModal({
          courseId: course.id,
          moduleId: module.id,
          copyCourseId: "",
        });
        setOpenCourseListModal(true);
      },
    },
  ];
  const nonOwnerMenu = [
    {
      label: "Copy Module",
      type: "function" as const,
      action: () => {
        setOpenDuplicateModal({
          courseId: course.id,
          moduleId: module.id,
          copyCourseId: "",
        });
        setOpenCourseListModal(true);
      },
    },
  ];

  if (!module || !user) {
    return (
      <div className="text-center py-8 text-muted-foreground" role="status">
        No available modules
      </div>
    );
  }

  const isInstructorOrTA =
    user?.groups.includes(
      process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors"
    ) || user?.groups.includes(course.id + "-TA");

  return (
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
          {orderCourseRecentlyCreatedAndStarred(courseList, starredCourses).map(
            (course) => (
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
            )
          )}
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

      <article className="group bg-card border rounded-xl hover-lift shadow-sm relative h-80 flex flex-col">
        <div
          className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden rounded-xl"
          aria-hidden="true"
        >
          <Play size={80} className="transform rotate-12" />
        </div>

        <div className="p-4 flex flex-col flex-1 relative z-10">
          <header className="relative z-10 flex items-start justify-between mb-3 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary 
              dark:group-hover:text-gold colorful-dark:group-hover:text-gold transition-colors duration-300">
                {module.name}
              </h2>
              {isInstructorOrTA && (
                <div className="flex items-center gap-2">
                  {module.isPublished ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 dark:bg-green-900 
                        colorful-dark:bg-green-900 dark:text-white colorful-dark:text-white pointer-events-none"
                      >
                        Published
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-gray-500" />
                      <Badge className="pointer-events-none" variant="secondary">Unpublished</Badge>
                    </>
                  )}
                </div>
              )}
              <div className="flex flex-col my-2 gap-2 text-xs text-muted-foreground">
                <div className="font-medium text-sm truncate-text">{courseInfo}</div>
                {module.moduleDescription && (
                  <p className="text-muted-foreground leading-relaxed text-sm line-clamp-2">
                    {module.moduleDescription}
                  </p>
                )}
              </div>
            </div>

            <nav
              className="flex items-center gap-1 ml-2 flex-shrink-0"
              aria-label="Module actions"
            >
              <TooltipWrapper
                content={isStarred ? "Unstar Module" : "Star Module"}
                side="top"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    isStarred ? removeStarredModule() : createStarredModule();
                  }}
                  disabled={isLoading}
                  className={cn(
                    "p-1 rounded-full transition-all duration-300 text-lg",
                    isStarred
                      ? "text-gold hover:text-muted"
                      : "text-muted hover:text-gold"
                  )}
                  aria-label={
                    isStarred ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Star
                    size={12}
                    fill={isStarred ? "currentColor" : "none"}
                    className={cn(
                      isStarred ? "hover:fill-none h-[1em] w-[1em]" : "hover:fill-current h-[1em] w-[1em]"
                    )}
                    aria-hidden="true"
                  />
                </button>
              </TooltipWrapper>

              {/* {isInstructorOrTA && ( //TODO figure this out later
                <TooltipWrapper content="View Reports">
                  <button
                    onClick={() =>
                      navigator(`/dashboard/${course.id}/${module.id}`)
                    }
                    className="p-1 text-primary hover:text-primary-foreground hover:bg-accent rounded-full transition-all duration-300"
                    aria-label="View module reports"
                  >
                    <Eye className="h-[1em] w-[1em]" aria-hidden="true" />
                  </button>
                </TooltipWrapper>
              )} */}

              {isInstructorOrTA && (
                <DropdownWrapper
                  trigger={
                    <button
                      className="p-1 text-lg text-primary hover:text-primary-foreground hover:bg-accent rounded-full transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      aria-label="Module options menu"
                    >
                      <MoreHorizontal className="h-[1em] w-[1em]" aria-hidden="true" />
                    </button>
                  }
                  actions={(user?.groups.includes(course.id) &&
                    (course.instructor.username === user.username ||
                      (course.taList &&
                        course.taList.find(
                          (a: CustomUserType) => a.username === user?.username
                        )))
                    ? ownerMenu
                    : nonOwnerMenu
                  ).map((item) => ({
                    label: item.label,
                    onClick: () => {
                      if (item.type === "link") {
                        navigator(item.action);
                      } else {
                        item.action();
                      }
                    },
                    type: item.type === "link" ? "link" : "button",
                    href: item.type === "link" ? item.action : undefined,
                  }))}
                  open={menuOpen}
                  onOpenChange={setMenuOpen}
                  tooltipContent="Module Options"
                  tooltipSide="top"
                />
              )}
            </nav>
          </header>

          <div className="flex-1" aria-hidden="true"></div>

          <Button
            onClick={handleBeginModule}
            variant="default"
            size="sm"
            className="relative z-10 flex-shrink-0 w-full flex items-center justify-center gap-2"
            disabled={isNavigatingToModule}
            aria-label={`Begin ${module.name} module`}
          >
            {isNavigatingToModule ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play size={14} aria-hidden="true" />
            )}
            Begin Module
          </Button>
        </div>
      </article>
    </>
  );
}
