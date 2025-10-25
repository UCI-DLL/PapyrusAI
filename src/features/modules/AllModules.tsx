import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import ModuleList from "./ModuleList";
import { orderCourseRecentlyCreated } from "../../utility/Helpers";
import { UserContext } from "../../utility/context/UserContext";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { UserStarred } from "../../utility/types/UserTypes";
import { Loader2, BookOpen } from "lucide-react";

export default function AllModules(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [starred, setStarred] = useState<UserStarred | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    //show all modules
    getCourses(controller.signal);
    getStarred(controller.signal);

    return () => {
      controller.abort();
    };

    // eslint-disable-next-line
  }, []);

  function getCourses(signal: AbortSignal) {
    setIsLoading(true);
    Get(getCourseList(), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          // Use next line if you want the list of all modules but dont care about the course id or name
          // setModuleList(res.data.flatMap((course: { modules: ModuleType; }) => course.modules));
          //Get the list of all courses for this user
          setCourseList(res.data);
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setError("No Modules Found");
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
    getCourses(controller.signal);
  }

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
            <BookOpen size={192} className="text-primary" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              All Available Modules
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Modules provide users access to conversations with the AI.
              {user?.groups.includes(
                process.env.REACT_APP_INSTRUCTOR
                  ? process.env.REACT_APP_INSTRUCTOR
                  : "PapyrusAIInstructors"
              )
                ? " Modules can be customized to allow or restrict access to specific conversation prompts (AI instructions)."
                : ""}
            </p>
            {user?.groups.includes(
              process.env.REACT_APP_INSTRUCTOR
                ? process.env.REACT_APP_INSTRUCTOR
                : "PapyrusAIInstructors"
            ) && (
                <div className="mt-4">
                  <p className="text-primary/80 text-sm leading-relaxed">
                    For information on creating, editing, copying, or viewing
                    activity for a module, please see the{" "}
                    <a
                      href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.1lkc6zx0k17t"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline underline-offset-2 hover:no-underline text-primary transition-colors duration-200"
                    >
                      "Modules" section of our instructor guide
                    </a>
                    .
                  </p>
                </div>
              )}
          </div>
        </div>
      </header>

      {error ? (
        <div
          className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
          role="alert"
        >
          <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">{error}</p>
        </div>
      ) : (
        <>
          {courseList.length > 0 ? (
            <section aria-labelledby="modules-content">
              <div className="space-y-6">
                {orderCourseRecentlyCreated(courseList).map((course, index) => {
                  return course.modules.length > 0 ? (
                    <div key={index} className="mb-6 w-full bg-card p-4 rounded-lg shadow-md">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {course.name}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {course.section
                            ? `${course.term ? course.term : ""}${course.year ? course.year : ""
                            } - ${course.section}`
                            : `${course.term ? course.term : ""}${course.year ? course.year : ""
                            }`}
                        </p>
                      </div>
                      <ModuleList
                        course={course}
                        refreshList={refreshList}
                        starredList={starred ? starred : undefined}
                        viewMode="card"
                      />
                    </div>
                  ) : null;
                })}
              </div>
            </section>
          ) : (
            <div
              className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
              role="status"
            >
              <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                No modules are currently available to you.
              </p>
              {user?.groups.includes(
                process.env.REACT_APP_INSTRUCTOR
                  ? process.env.REACT_APP_INSTRUCTOR
                  : "PapyrusAIInstructors"
              ) ? (
                <p className="text-sm">
                  To create a module, go to the course in which you would like
                  to create the module.
                </p>
              ) : null}
            </div>
          )}
        </>
      )}
    </main>
  );
}
