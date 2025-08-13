import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
} from "react";
import CourseList from "../course-groups/CourseList";
import ModuleList from "../modules/ModuleList";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import { CourseType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";
import AddCourseForm from "../course-groups/AddCourseForm";
import { AlertContext } from "../../utility/context/AlertContext";
import { orderCourseRecentlyCreatedAndStarred } from "../../utility/Helpers";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { UserStarred } from "../../utility/types/UserTypes";
import { ExternalLink, EyeIcon, Loader2, PlusIcon, Target } from "lucide-react";
import { Dialog, DialogTrigger } from "../../components/ui/dialog";

export default function Dashboard(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false);
  const [starred, setStarred] = useState<UserStarred | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddCourseModal) {
      getCourses(controller.signal);
      getStarred(controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, []);

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
          setCourseList([]);
          setIsLoading(false);
          setAlert({
            message: "Encountered an error. Please try again later.",
            type: "error",
          });
        }
      }
    });
  }

  function getStarred(signal: AbortSignal) {
    Get(getUserFavoritingData(), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          setStarred(res.data);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
        }
      }
    });
  }

  const refreshList = useCallback(() => {
    const controller = new AbortController();
    getCourses(controller.signal);
    getStarred(controller.signal);
  }, []);

  const starredCourses = useMemo(
    () => starred?.courses ?? [],
    [starred?.courses]
  );

  const orderedCourses = useMemo(
    () => orderCourseRecentlyCreatedAndStarred(courseList, starredCourses),
    [courseList, starredCourses]
  );

  const coursesWithRecentModules = useMemo(
    () => mostRecentModules(orderedCourses),
    [orderedCourses]
  );

  const isInstructor = useMemo(
    () =>
      user?.groups.includes(
        process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors"
      ),
    [user?.groups]
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
          <p className="text-muted-foreground">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <header className="slide-in-up">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <Target size={192} className="floating-animation text-primary" />
          </div>

          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1 text-foreground">
              Welcome back,{" "}
              <span className="text-primary text-2xl">{user?.name}!</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Continue your learning journey and unlock your potential.
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="courses-heading">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2
              id="courses-heading"
              className="text-2xl font-extrabold text-foreground"
            >
              My Courses
            </h2>
            <p className="text-muted-foreground text-sm">
              Continue your learning journey
            </p>
          </div>
          <nav
            className="flex flex-col md:flex-row gap-2"
            role="toolbar"
            aria-label="Course actions"
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator("/courses")}
              aria-label="View all courses"
            >
              <EyeIcon className="w-4 h-4" aria-hidden="true" />
              View All
            </Button>
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
              list={orderedCourses.slice(0, 6)}
              refreshList={refreshList}
              starredList={starredCourses}
            />
          ) : (
            <div
              className="text-center py-8 text-muted-foreground"
              role="status"
            >
              <p className="mb-2">
                No courses added yet. To join a course, click "Join Course"
                above.
              </p>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="modules-heading">
        <header className="flex flex-row items-center justify-between gap-4 mb-4">
          <div>
            <h2
              id="modules-heading"
              className="text-2xl font-extrabold text-foreground"
            >
              Recent Modules
            </h2>
            <p className="text-muted-foreground text-sm">
              Pick up where you left off
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator("/modules")}
            aria-label="View all modules"
          >
            <EyeIcon className="w-4 h-4" aria-hidden="true" />
            View All
          </Button>
        </header>

        <div className="space-y-4">
          {courseList.length > 0 &&
            coursesWithRecentModules.map((course, index) => {
              return course.modules.length > 0 ? (
                <div className="w-full" key={course.id || index}>
                  <ModuleList
                    course={{
                      ...course,
                      modules: course.mostRecentItem
                        ? [course.mostRecentItem]
                        : [],
                    }}
                    refreshList={refreshList}
                    starredList={starred}
                  />
                </div>
              ) : null;
            })}
        </div>
      </section>
    </main>
  );
}

function mostRecentModules(courses: Array<CourseType>) {
  const categoriesWithRecentItems = courses.map((course) => {
    const mostRecentItem =
      course.modules.length > 0
        ? course.modules.reduce((latest, item) =>
            item.id > latest.id ? item : latest
          )
        : null;

    return { ...course, mostRecentItem };
  });
  return categoriesWithRecentItems;
}
