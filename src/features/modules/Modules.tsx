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
import { Loader2, PlusIcon, GraduationCap, ChartColumnBig, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { useTranslation } from "../../hooks/useTranslation";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { handleCourseTermLanguage } from "../../utility/Helpers";

export default function Modules(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [course, setCourse] = useState<CourseType>();
  const [starred, setStarred] = useState<UserStarred | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");

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
          setError(t("courses.courseDoesNotExist"));
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

  // Filter modules based on search query
  const filteredModules = course ? course.modules.filter((module) =>
    module.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

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
          <p className="text-muted-foreground">{t("modules.loadingModules")}</p>
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

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                  {course?.name
                    ? `${course.name} ${t("common.modules")}`
                    : t("modules.availableModules")}
                </h1>
              </div>

              <nav
                className="flex flex-col md:flex-row gap-2 md:shrink-0"
                aria-label={`${t("common.module")} ${t("common.actions")}}`}
              >
                {isInstructorOrTA && ( //TODO
                  <Button size="sm" asChild aria-label="Create new module" variant="outline">
                    <Link
                      to={`/reports/course/${course?.id}`}
                      className="no-underline hover:text-white"
                    >
                      <ChartColumnBig className="w-4 h-4" aria-hidden="true" />
                      {t("common.view")} {t("common.reports")}
                    </Link>
                  </Button>
                )}
                {isInstructorOrTA && ( //TODO
                  <Button size="sm" asChild aria-label="Create new module">
                    <Link
                      to={`/courses/${course?.id}/createmodule`}
                      className="no-underline hover:text-white "
                    >
                      <PlusIcon className="w-4 h-4" aria-hidden="true" />
                      {t("common.create")} {t("common.module")}
                    </Link>
                  </Button>
                )}
              </nav>
            </div>

            {course && (
              <div className="flex flex-wrap flex-row justify-between mb-2">
                <div className="mr-4">
                  <p className="text-md capitalize m-0">
                    {course.section
                      ? `${user && course.term ? handleCourseTermLanguage(user["custom:language"], course.term) : ""} ${course.year ?? ""} - ${course.section
                      }`
                      : `${user && course.term ? handleCourseTermLanguage(user["custom:language"], course.term) : ""} ${course.year ?? ""}`}
                  </p>
                  <span className="text-sm text-muted-foreground m-0">{t("modules.term")}</span>
                </div>
                <div className="mr-4">
                  <p className="text-md m-0">
                    {course.instructor.name}{" "}
                    {course.instructor.family_name}
                  </p>
                  <span className="text-sm text-muted-foreground m-0">{t("common.instructor")}</span>
                </div>
                <div className="mr-4">
                  <p className="text-md m-0">
                    {course.modules.filter(x => x.isPublished).length}
                  </p>
                  <span className="text-sm text-muted-foreground m-0">{t("modules.publishedModules")}</span>
                </div>
              </div>
            )}

            {course && course.modules.length > 0 && (
              <InfoAccordion>
                <p className="text-muted-foreground max-w-2xl text-base leading-6">
                  {t("modules.moduleListDescription")}&nbsp;
                  <a
                    href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.1lkc6zx0k17t"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold transition-colors duration-200"
                  >
                    {t("modules.moduleListDescriptionLinkText")}
                  </a>
                  .
                </p>
              </InfoAccordion>
            )}
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
        <section aria-labelledby="modules-content">
          <div className="mb-6 w-full bg-card p-4 rounded-lg shadow-md">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="module-content"
                type="text"
                placeholder={t("modules.searchModules")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search modules" //TODO
              />
            </div>
          </div>
          <div className="w-full" id="modules-content">
            {course ? (
              <ModuleList
                course={{ ...course, modules: filteredModules }}
                refreshList={refreshList}
                starredList={starred ? starred : undefined}
                viewMode="card"
              />
            ) : (
              <div
                className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
                role="status"
              >
                <GraduationCap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">{t("modules.noModulesAvailable")}</p>
                <p className="text-sm">
                  {t("modules.noModulesAvailable")}
                  {isInstructor && (
                    <>
                      {" "}
                      {t("modules.createModulePrompt")}
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
