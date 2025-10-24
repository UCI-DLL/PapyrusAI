import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import CourseList from "../course-groups/CourseList";
import ModuleList from "../modules/ModuleList";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import { CourseType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";
import AddCourseForm, {
  AddCourseFormHandle,
} from "../course-groups/AddCourseForm";
import { AlertContext } from "../../utility/context/AlertContext";
import { orderCourseRecentlyCreatedAndStarred } from "../../utility/Helpers";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { UserStarred } from "../../utility/types/UserTypes";
import { ExternalLink, EyeIcon, Loader2, PlusIcon, Target } from "lucide-react";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { Link } from "react-router-dom";

export default function Dashboard(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false);
  const [isJoiningCourse, setIsJoiningCourse] = useState<boolean>(false);
  const [starred, setStarred] = useState<UserStarred | undefined>();
  const addCourseFormRef = useRef<AddCourseFormHandle>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddCourseModal) {
      getCourses(controller.signal);
      getStarred(controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Standard Page Header Pattern */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <Target size={192} className="text-primary" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Continue your learning journey and unlock your potential.
            </p>
          </div>
        </div>
      </header>

      {/* Courses Section */}
      <section aria-labelledby="courses-heading">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2
              id="courses-heading"
              className="text-2xl font-bold text-foreground mb-1"
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
              asChild
              aria-label="View all courses"
            >
              <Link to="/courses" className="no-underline">
                <EyeIcon className="w-4 h-4" aria-hidden="true" />
                View All
              </Link>
            </Button>
            {isInstructor && (
              <Button
                size="sm"
                variant="outline"
                asChild
                aria-label="Create new course"
              >
                <Link to="/createcourse" className="no-underline">
                  <PlusIcon className="w-4 h-4" aria-hidden="true" />
                  Create Course
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              aria-label="Join existing course"
              onClick={() => setShowAddCourseModal(true)}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Join Course
            </Button>

            <DialogWrapper
              open={showAddCourseModal}
              onOpenChange={setShowAddCourseModal}
              title="Join Course by Sign Up Code"
              description="Enter the unique course sign up code associated with the course you want to join. Not sure what the sign up code is? Ask the instructor of the course!"
              contentClassName="sm:max-w-md"
              actions={[
                {
                  label: "Cancel",
                  onClick: () => setShowAddCourseModal(false),
                  variant: "outline",
                },
                {
                  label: isJoiningCourse ? "Joining..." : "Join Course",
                  onClick: () => addCourseFormRef.current?.handleSubmit(),
                  disabled: isJoiningCourse,
                },
              ]}
            >
              <AddCourseForm
                ref={addCourseFormRef}
                closeForm={() => setShowAddCourseModal(false)}
                setIsLoading={setIsJoiningCourse}
              />
            </DialogWrapper>
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
              className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
              role="status"
            >
              <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No courses found</p>
              <p className="text-sm">
                No courses added yet. To join a course, click "Join Course"
                above.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Modules Section */}
      <section aria-labelledby="modules-heading">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2
              id="modules-heading"
              className="text-2xl font-bold text-foreground mb-1"
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
            asChild
            aria-label="View all modules"
          >
            <Link to="/modules" className="no-underline">
              <EyeIcon className="w-4 h-4" aria-hidden="true" />
              View All
            </Link>
          </Button>
        </header>

        <div className="w-full">
          {courseList.length > 0 &&
            coursesWithRecentModules.some(
              (course) => course.modules.length > 0
            ) ? (
            <div className="space-y-4 flex flex-col items-center">
              {coursesWithRecentModules.map((course, index) => {
                return course.modules.length > 0 ? (
                  <div style={{ width: "99%" }} key={course.id || index}>
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
          ) : (
            <div
              className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
              role="status"
            >
              <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No recent modules</p>
              <p className="text-sm">
                {courseList.length === 0
                  ? "Join a course to access modules and start learning."
                  : "No modules available in your courses yet."}
              </p>
            </div>
          )}
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
