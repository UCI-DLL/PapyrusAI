import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import CourseList from "./CourseList";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import { UserContext } from "../../utility/context/UserContext";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import AddCourseForm, { AddCourseFormHandle } from "./AddCourseForm";
import { getUserFavoritingData, logEvent } from "../../utility/endpoints/UserEndpoints";
import {
  Loader2,
  PlusIcon,
  ExternalLink,
  BookOpen,
  Search,
} from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import Post from "../../utility/Post";

export default function Courses(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false);
  const [isJoiningCourse, setIsJoiningCourse] = useState<boolean>(false);
  const [starredCourses, setStarredCourses] = useState<
    Array<{ courseId: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const addCourseFormRef = useRef<AddCourseFormHandle>(null);

  useEffect(() => {
    //log page
    Post(logEvent(), {
      eventType: "view_page",
      metadata: {
        page: "courses",
      }
    })
  })

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
          setError(t("courses.noCoursesFound"));
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

  // Filter courses based on search query
  const filteredCourses = courseList.filter((course) =>
    course.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <p className="text-muted-foreground">{t("courses.loadingCourses")}</p>
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
            <div>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                  {t("courses.myCourses")}
                </h1>
                <nav
                  className="flex flex-col md:flex-row gap-2 md:shrink-0"
                  aria-label={t("createCourse.courseActions")}
                >
                  {isInstructor && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      aria-label={t("dashboard.createCourse")}
                    >
                      <Link to="/createcourse" className="no-underline">
                        <PlusIcon className="w-4 h-4" aria-hidden="true" />
                        {t("dashboard.createCourse")}
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    aria-label={t("dashboard.joinCourse")}
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
              </div>
              <InfoAccordion>
                <p className="text-muted-foreground max-w-2xl text-base leading-6">
                  {t("courses.createCourseDescription")}&nbsp;
                  <a
                    href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.y2e0cshr9a50"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold transition-colors duration-200"
                  >
                    {t("courses.createCourseDescriptionLinkText")}
                  </a>
                  .
                </p>
              </InfoAccordion>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div
          className="bg-destructive/15 border border-destructive rounded-lg p-4"
          role="alert"
        >
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : (
        <section aria-labelledby="courses-content">
          <div className="mb-6 w-full bg-card p-4 rounded-lg shadow-md">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="courses-content"
                type="text"
                placeholder={t("courses.searchCourses")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label={t("courses.searchCourses")}
              />
            </div>
          </div>

          <div className="w-full">
            {courseList.length > 0 ? (
              filteredCourses.length > 0 ? (
                <CourseList
                  list={filteredCourses}
                  refreshList={refreshList}
                  starredList={starredCourses}
                />
              ) : (
                <div
                  className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
                  role="status"
                >
                  <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">{t("courses.noCoursesFound")}</p>
                  <p className="text-sm">
                    {t("courses.noCoursesMatchSearch")}
                  </p>
                </div>
              )
            ) : (
              <div
                className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
                role="status"
              >
                <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">{t("courses.noCoursesFound")}</p>
                <p className="text-sm">
                  {t("courses.noCoursesAdded")}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
