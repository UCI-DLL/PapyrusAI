import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import CourseList from "./CourseList";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import { UserContext } from "../../utility/context/UserContext";
import {
  Dialog,
  DialogTrigger,
} from "../../components/ui/dialog";
import AddCourseForm from "./AddCourseForm";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { Loader2, PlusIcon, ExternalLink, BookOpen } from "lucide-react";

export default function Courses(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false);
  const [starredCourses, setStarredCourses] = useState<
    Array<{ courseId: string }>
  >([]);

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddCourseModal) {
      getCourses(controller.signal);
      getStarredCourses(controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [showAddCourseModal]);

  function getCourses(signal: AbortSignal) {
    setIsLoading(true);
    Get(getCourseList(), signal).then((res) => {
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
          setError("No Courses Found");
          setIsLoading(false);
        }
      }
    });
  }

  function getStarredCourses(signal: AbortSignal) {
    Get(getUserFavoritingData(), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.courses) {
          //get the list of all favorited courses for this specific user
          setStarredCourses(res.data.courses);
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
    getStarredCourses(controller.signal);
  }

  const isInstructor = user?.groups.includes(
    process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors"
  );

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
          <p className="text-muted-foreground">Loading Courses</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Standard Page Header Pattern */}
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
              My Courses
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Courses are spaces in which instructors can create and organize
              modules that customize how students can interact with the AI.
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="bg-destructive/15 border border-destructive rounded-lg p-4" role="alert">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : (
        <section aria-labelledby="courses-content">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2
                id="courses-content"
                className="text-2xl font-bold text-foreground mb-1"
              >
                Course Collection
              </h2>
              <p className="text-muted-foreground text-sm">
                {courseList.length > 0
                  ? `To access a course, click the "View Modules" button for your desired course and choose from the available modules.${
                      isInstructor
                        ? " To edit or duplicate a course, click on the options menu for the course you wish to use."
                        : ""
                    }`
                  : "Join a course to get started with your learning journey."}
              </p>
            </div>
            <nav
              className="flex flex-col md:flex-row gap-2"
              role="toolbar"
              aria-label="Course actions"
            >
              {isInstructor && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator("/createcourse")}
                  aria-label="Create new course"
                >
                  <PlusIcon className="w-4 h-4" aria-hidden="true" />
                  Create Course
                </Button>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" aria-label="Join existing course">
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    Join Course
                  </Button>
                </DialogTrigger>
                <AddCourseForm
                  closeForm={() => {
                    setShowAddCourseModal(false);
                  }}
                />
              </Dialog>
            </nav>
          </header>

          <div className="w-full">
            {courseList.length > 0 ? (
              <CourseList
                list={courseList}
                refreshList={refreshList}
                starredList={starredCourses}
              />
            ) : (
              <div
                className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
                role="status"
              >
                <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No courses found</p>
                <p className="text-sm">
                  No courses added yet. To join a course, click "Join Course"
                  above.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
