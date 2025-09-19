import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import ModuleList from "./ModuleList";
import { UserContext } from "../../utility/context/UserContext";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { UserStarred } from "../../utility/types/UserTypes";
import { Loader2, PlusIcon, GraduationCap, ExternalLink } from "lucide-react";

export default function Modules(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [course, setCourse] = useState<CourseType>();
  const [starred, setStarred] = useState<UserStarred | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    if (
      location.pathname.split("/")[1] === "courses" &&
      location.pathname.split("/")[2]
    ) {
      const courseId = location.pathname.split("/")[2];
      getThisCourse(courseId, controller.signal);
      getStarred(controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location]);

  function getThisCourse(courseId: string, signal: AbortSignal) {
    Get(getCourse(courseId), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //Get the course and save the modules
          setCourse(res.data);
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

  function getStarred(signal: AbortSignal) {
    Get(getUserFavoritingData(), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //get the list of all favorited for this specific user
          setStarred(res.data);
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

  function refreshList() {
    const controller = new AbortController();
    getThisCourse(location.pathname.split("/")[2], controller.signal);
    getStarred(controller.signal);
  }

  const isInstructor = user?.groups.includes(
    process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors"
  );

  const isInstructorOrTA =
    course &&
    ((isInstructor && course.instructor.username === user?.username) ||
      user?.groups.includes(course.id + "-TA"));

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">Loading Modules</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <GraduationCap size={192} className="text-primary" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              {course?.name
                ? `${course.name} Modules`
                : "Available Modules"}
            </h1>
            {course && (
              <div className="space-y-1 mb-2">
                <p className="text-sm text-muted-foreground font-medium">
                  {course.section
                    ? `${course.term ?? ""}${course.year ?? ""} - ${
                        course.section
                      }`
                    : `${course.term ?? ""}${course.year ?? ""}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Instructor: {course.instructor.name}{" "}
                  {course.instructor.family_name}
                </p>
              </div>
            )}
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Modules provide users access to conversations with the AI.
              {isInstructor
                ? " Modules can be customized to allow or restrict access to specific conversation prompts (AI instructions)."
                : ""}
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="bg-destructive/15 border border-destructive rounded-lg p-4" role="alert">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : (
        <section aria-labelledby="modules-content">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2
                id="modules-content"
                className="text-2xl font-bold text-foreground mb-1"
              >
                Course Modules
              </h2>
              <p className="text-muted-foreground text-sm">
                {course && course.modules.length > 0 ? (
                  <>
                    To access a module, click the "Begin Module" button for the
                    desired module.
                    {isInstructor && (
                      <>
                        {" "}
                        For information on creating, editing, copying, or
                        viewing activity for a module, please see the{" "}
                        <a
                          href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.1lkc6zx0k17t"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline underline-offset-2 hover:no-underline font-medium transition-colors duration-200 inline-flex items-center gap-1"
                        >
                          "Modules" section of our instructor guide
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                        .
                      </>
                    )}
                  </>
                ) : (
                  "Start learning by selecting a module below."
                )}
              </p>
            </div>
            {isInstructorOrTA && (
              <nav
                className="flex flex-col md:flex-row gap-2"
                role="toolbar"
                aria-label="Module actions"
              >
                <Button
                  size="sm"
                  onClick={() =>
                    navigator(`/courses/${course?.id}/createmodule`)
                  }
                  aria-label="Create new module"
                >
                  <PlusIcon className="w-4 h-4" aria-hidden="true" />
                  Create Module
                </Button>
              </nav>
            )}
          </header>

          <div className="w-full">
            {course ? (
              <ModuleList
                course={course}
                refreshList={refreshList}
                starredList={starred ? starred : undefined}
              />
            ) : (
              <div
                className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
                role="status"
              >
                <GraduationCap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No modules available</p>
                <p className="text-sm">
                  No modules in this course are currently available to you.
                  {isInstructor && (
                    <>
                      {" "}
                      To create a module, go to the course in which you would
                      like to create the module.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
