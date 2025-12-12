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
import type { CourseType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";
import AddCourseForm, { type
  AddCourseFormHandle,
} from "../course-groups/AddCourseForm";
import { AlertContext } from "../../utility/context/AlertContext";
import { orderCourseRecentlyCreatedAndStarred } from "../../utility/Helpers";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import type { UserStarred } from "../../utility/types/UserTypes";
import { ExternalLink, EyeIcon, PlusIcon, Target } from "lucide-react";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { Link } from "react-router-dom";
import { PageLoader, PageHeaderCard } from "../../components/Common";
import { useTranslation } from "../../hooks/useTranslation";

export default function Dashboard(): JSX.Element {
  const navigator = useNavigate();
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
            message: t("common.errorMessage"),
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

  const { t } = useTranslation();

  if (isLoading) {
    return <PageLoader pageName="Dashboard" />
  }
  
  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <PageHeaderCard title={t("dashboard.welcome") + ", " + user?.name + "!"} icon={<Target size={192} className="text-primary" />} />

      {/* Courses Section */}
      <section aria-labelledby="courses-heading">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2
              id="courses-heading"
              className="text-2xl font-bold text-foreground mb-1"
            >
              {t("dashboard.myCourses")}
            </h2>
          </div>
          <nav
            className="flex flex-col md:flex-row gap-2"
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
                {t("common.viewAll")}
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
                  {t("dashboard.createCourse")}
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              aria-label="Join existing course"
              onClick={() => setShowAddCourseModal(true)}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              {t("dashboard.joinCourse")}
            </Button>

            <DialogWrapper
              open={showAddCourseModal}
              onOpenChange={setShowAddCourseModal}
              title={t("dashboard.joinCourseByCode")}
              description={t("dashboard.joinCourseDescription")}
              contentClassName="sm:max-w-md"
              actions={[
                {
                  label: t("common.cancel"),
                  onClick: () => setShowAddCourseModal(false),
                  variant: "outline",
                },
                {
                  label: isJoiningCourse ? t("dashboard.joining") : t("dashboard.joinCourse"),
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
              <p className="text-lg font-medium mb-2">{t("courses.noCoursesFound")}</p>
              <p className="text-sm">
                {t("courses.noCoursesAdded")}
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
              {t("dashboard.recentModules")}
            </h2>
          </div>

          <Button
            size="sm"
            variant="outline"
            asChild
            aria-label="View all modules"
          >
            <Link to="/modules" className="no-underline">
              <EyeIcon className="w-4 h-4" aria-hidden="true" />
              {t("common.viewAll")}
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
              <p className="text-lg font-medium mb-2">{t("dashboard.recentModules")}</p>
              <p className="text-sm">
                {courseList.length === 0
                  ? t("dashboard.pickup")
                  : t("modules.noModulesAvailable")}
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
