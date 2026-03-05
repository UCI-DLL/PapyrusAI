import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { Badge } from "../../components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  ChevronDown,
  Info,
  Loader2,
  X,
  BookOpen,
  Users,
  Calendar,
  Clock,
  Trash2,
  XCircle,
  CheckCircle,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  postCreateCourse,
  getCourse,
  putUpdateCourse,
} from "../../utility/endpoints/CourseEndpoints";
import Post from "../../utility/Post";
import Put from "../../utility/Put";
import { AlertContext } from "../../utility/context/AlertContext";
import Get from "../../utility/Get";
import { getUserList, logEvent } from "../../utility/endpoints/UserEndpoints";
import { CustomUserType, UserType } from "../../utility/types/UserTypes";
import { CourseType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";

type CourseFormType = {
  name: string;
  signUpCode: string;
  isActive: boolean;
  isDeleted?: boolean;
  year: string;
  section: string;
  term: string;
  taList: any;
};

type CourseFormMode = "create" | "edit";

interface CourseFormProps {
  mode?: CourseFormMode;
  courseId?: string;
}

// Options will be translated in the component

export default function CreateCourse({
  mode = "create",
  courseId,
}: CourseFormProps = {}): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const { t } = useTranslation();

  // Determine if we're in edit mode based on URL or props
  const isEditMode =
    mode === "edit" || location.pathname.includes("/editcourse/");
  const actualCourseId =
    courseId || (isEditMode ? location.pathname.split("/")[2] : undefined);

  // Translated options
  const options = [
    t("createCourse.savePublish"),
    t("createCourse.saveNoPublish"),
    t("createCourse.discardChanges"),
  ];

  const [session, setSession] = useState<CourseFormType>({
    name: "",
    signUpCode: "",
    isActive: false,
    isDeleted: false,
    year: "",
    section: "",
    term: "",
    taList: [],
  });
  const [prevSession, setPrevSession] = useState<CourseType | undefined>();
  const [errors, setErrors] = useState<CourseFormType>({
    name: "",
    signUpCode: "",
    isActive: false,
    isDeleted: false,
    year: "",
    section: "",
    term: "",
    taList: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const { setAlert } = useContext(AlertContext);
  const [userList, setUserList] = useState<Array<CustomUserType>>([]);
  const { user, setUser } = useContext(UserContext);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openActiveModal, setOpenActiveModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] =
    useState<boolean>(false);
  const [taSearchQuery, setTaSearchQuery] = useState<string>("");
  const [openTaPopover, setOpenTaPopover] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();

    if (userList.length === 0) {
      getUsers("", controller.signal);
    }

    //log page
    var metadata: any = {
      isEditMode: isEditMode,
      page: "create_course",
    }
    if (actualCourseId) {
      metadata["courseId"] = actualCourseId
    }
    Post(logEvent(), {
      eventType: "view_page",
      metadata: metadata
    })

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (isEditMode && actualCourseId) {
      // Load existing course data for edit mode
      Get(getCourse(actualCourseId), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //set prev course data
            setPrevSession(res.data);
            //also set session
            setSession({
              name: res.data.name,
              signUpCode: res.data.signUpCode,
              isDeleted: res.data.isDeleted,
              isActive: res.data.isActive,
              year: res.data.year ? res.data.year : "",
              term: res.data.term ? res.data.term : "",
              section: res.data.section ? res.data.section : "",
              taList: res.data.taList ? res.data.taList : [],
            });
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
    } else if (!isEditMode) {
      // For create mode, just set loading to false
      setIsLoading(false);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [isEditMode, actualCourseId]);

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    if (index === 0) {
      //Save and publish
      handleSubmit(e, true, false);
    } else if (index === 1) {
      //save and not publish
      if (isEditMode && session.isActive) {
        //handle case that course is already active and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (index === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (selectedIndexSave === 0) {
      handleSubmit(e, true, false);
    } else if (selectedIndexSave === 1) {
      if (isEditMode && session.isActive) {
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (selectedIndexSave === 2) {
      setOpenDiscardModal(true);
    }
  };

  function getUsers(PaginationToken: string, signal: AbortSignal) {
    var limit = 50;

    Get(getUserList(limit, PaginationToken), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data["Users"]) {
          //filter out current user and email_verified
          var tempUserList = res.data["Users"].map((u: CustomUserType) => {
            return {
              name: u.name,
              family_name: u.family_name,
              email: u.email,
              sub: u.sub,
              username: u.username,
            };
          });
          if (user) {
            tempUserList = tempUserList.filter(
              (x: CustomUserType) => x.username !== user.username
            );
          }
          setUserList((prev) => [...prev, ...tempUserList]);

          //handle pages
          //note: PaginationToken will also come back as "undefined" if there are no more pages
          if (
            res.data["Users"].length >= limit &&
            res.data["PaginationToken"]
          ) {
            getUsers(res.data["PaginationToken"], signal);
          } else {
            setIsLoading(false);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
        }
      }
      // Only set loading to false if we're not in edit mode or if course data is already loaded
      if (!isEditMode || prevSession) {
        setIsLoading(false);
      }
    });
  }

  function handleSubmit(e: any, isActive = false, isDeleted = false) {
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: t("errorMessage.nameMissing") }));
    } else if (session.signUpCode === "") {
      setErrors((prev) => ({ ...prev, signUpCode: t("courses.signUpCodeMissing") }));
    } else {
      // set is loading
      setIsLoading(true);

      if (isEditMode && prevSession) {
        // Update course
        //dont send signupcode if it didnt change
        if (prevSession.signUpCode === session.signUpCode) {
          const dataToSend = {
            name: session.name,
            isActive: isActive,
            isDeleted: isDeleted,
            year: session.year,
            section: session.section,
            term: session.term,
            taList: session.taList,
          };
          // put data back
          Put(putUpdateCourse(prevSession.id), dataToSend).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //pop up notifying user of update
                setAlert({ message: t("createCourse.courseUpdated"), type: "success" });
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              // set errors
              setAlert({ message: res.data, type: "error" });
            }
            // set is loading back
            setIsLoading(false);
          });
        } else {
          // put data back
          Put(putUpdateCourse(prevSession.id), session).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //pop up notifying user of update
                setAlert({ message: t("createCourse.courseUpdated"), type: "success" });
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              // set errors
              setAlert({ message: res.data, type: "error" });
            }
            // set is loading back
            setIsLoading(false);
          });
        }
      } else {
        // Create course
        const dataToSend = {
          name: session.name,
          signUpCode: session.signUpCode,
          isActive: isActive,
          year: session.year,
          section: session.section,
          term: session.term,
          taList: session.taList,
        };
        // post data back
        Post(postCreateCourse(), dataToSend).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data) {
              // update user and group list
              var newGroups = user?.groups;
              newGroups?.push(res.data.id);
              setUser({ ...user, groups: newGroups } as UserType);
              localStorage.setItem(
                "papyrusai_user",
                JSON.stringify({ ...user, groups: newGroups })
              );
              //redirect to course list
              navigator("/courses");
              // pop up notifying user of creation
              setAlert({ message: t("createCourse.courseCreated"), type: "success" });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // set errors
            setAlert({ message: res.data, type: "error" });
          }
          // set is loading back
          setIsLoading(false);
        });
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleTermChange(value: string) {
    setSession((prev) => ({ ...prev, term: value }));
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
          <p className="text-muted-foreground">
            {isEditMode
              ? t("courses.loadingCourses")
              : t("createCourse.loadingCourseForm")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Dialogs */}
      <DialogWrapper
        open={showSavePublishTooltip}
        onOpenChange={setShowSavePublishTooltip}
        title={t("createCourse.whatIsSavePublish")}
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: t("components.gotIt"),
            onClick: () => setShowSavePublishTooltip(false),
          },
        ]}
      >
        <div className="space-y-3">
          <p>
            {t("createCourse.savePublishDescription")}
          </p>
        </div>
      </DialogWrapper>

      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title={t("createCourse.discardChangesTitle")}
        description={t("createCourse.discardChangesDescription")}
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenDiscardModal(false),
            variant: "outline",
          },
          {
            label: t("createCourse.discardChanges"),
            onClick: () => navigator(-1),
            variant: "destructive",
          },
        ]}
      />

      {/* Edit-specific dialogs */}
      {isEditMode && (
        <>
          <DialogWrapper
            open={openDeleteModal}
            onOpenChange={setOpenDeleteModal}
            title={t("createCourse.deleteCourseQuestion")}
            description={t("createCourse.deleteCourseDescription")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: t("common.cancel"),
                onClick: () => setOpenDeleteModal(false),
                variant: "outline",
              },
              {
                label: t("createCourse.deleteCourse"),
                onClick: () => handleSubmit(null, false, true),
                variant: "destructive",
              },
            ]}
          />

          <DialogWrapper
            open={openActiveModal}
            onOpenChange={setOpenActiveModal}
            title={t("createCourse.unpublishCourse")}
            description={t("createCourse.unpublishCourseDescription")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: t("common.cancel"),
                onClick: () => setOpenActiveModal(false),
                variant: "outline",
              },
              {
                label: t("common.continue"),
                onClick: () => handleSubmit(null, false, false),
                variant: "default",
              },
            ]}
          />
        </>
      )}

      {/* Main Content */}
      {!error ? (
        <div className="bg-background text-foreground p-4 space-y-6">
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
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                      {isEditMode
                        ? t("createCourse.editCourse", { courseName: prevSession?.name || t("common.courses") })
                        : t("createCourse.createCourse")}
                    </h1>
                    {isEditMode && (
                      <div className="flex items-center gap-2">
                        {session.isActive ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-white 
                              colorful-dark:bg-green-900 colorful-dark:text-white pointer-events-none"
                            >
                              {t("components.published")}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-gray-500" />
                            <Badge className="pointer-events-none" variant="secondary">{t("components.unpublished")}</Badge>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <nav
                    className="flex flex-col md:flex-row gap-2"
                    aria-label={`${t("createCourse.createCourse")} ${t("common.actions")}}`}
                  >
                    {isEditMode && (
                      <TooltipWrapper content={t("createCourse.deleteCourse")}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenDeleteModal(true)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={t("createCourse.deleteCourse")}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipWrapper>
                    )}
                    <TooltipWrapper content={t("common.info")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSavePublishTooltip(true)}
                        aria-label={t("createCourse.getSavePublishHelp")}
                      >
                        <Info className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TooltipWrapper>

                    <div className="flex rounded-lg border">
                      <Button
                        size="sm"
                        onClick={handleClick}
                        className="rounded-none border-0 w-full rounded-l"
                        disabled={isLoading}
                        aria-label={`${options[selectedIndexSave]} ${t("components.courses")}`}
                      >
                        {options[selectedIndexSave]}
                      </Button>
                      <DropdownMenu
                        open={openSaveTop}
                        onOpenChange={setOpenSaveTop}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="rounded-none border-0 border-l px-2 rounded-r"
                            variant="default"
                            disabled={isLoading}
                            aria-label={t("createModule.saveStrategy")}
                          >
                            <ChevronDown
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {options.map((option, index) => (
                            <DropdownMenuItem
                              key={option}
                              onClick={() => {
                                const fakeEvent = {} as React.MouseEvent<
                                  HTMLDivElement,
                                  MouseEvent
                                >;
                                handleMenuItemClick(fakeEvent, index);
                              }}
                              className={cn(
                                index === selectedIndexSave && "bg-primary/30",
                                index === 2 &&
                                "text-destructive focus:bg-destructive focus:text-destructive-foreground"
                              )}
                            >
                              {option}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </nav>
                </div>

                <InfoAccordion>
                  <p className="text-muted-foreground max-w-2xl text-base leading-6">
                    {t("createCourse.courseDescriptionPart1")}&nbsp;
                    <a
                      href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.y2e0cshr9a50"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold transition-colors duration-200"
                    >
                      {t("createCourse.courseDescriptionLinkText")}
                    </a>
                    .
                  </p>
                </InfoAccordion>
              </div>
            </div>
          </header>

          {/* Form */}
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  {t("createCourse.basicInformation")}
                </CardTitle>
                <CardDescription>
                  {t("createCourse.enterCourseInfo")}. {t("common.required")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      {t("createCourse.courseName")} *
                    </Label>
                    <TooltipWrapper content={t("createCourse.courseNameDescription")}>
                      <button type="button" aria-label={t("createCourse.courseNameDescription")}>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </button>
                    </TooltipWrapper>
                  </div>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t("createCourse.courseNamePlaceholder")}
                    value={session.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={cn(
                      "transition-colors",
                      errors.name &&
                      "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.name !== "" && (
                    <p
                      className="text-sm text-destructive flex items-center gap-1"
                      role="alert"
                      aria-live="assertive"
                    >
                      <X className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="signUpCode" className="text-sm font-medium">
                      {t("createCourse.courseSignUpCode")} *
                    </Label>
                    <TooltipWrapper content={t("createCourse.courseSignUpCodeDescription")}>
                      <button type="button" aria-label={t("createCourse.courseSignUpCodeDescription")}>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </button>
                    </TooltipWrapper>
                  </div>
                  <Input
                    id="signUpCode"
                    name="signUpCode"
                    placeholder={t("createCourse.courseSignUpCodePlaceholder")}
                    value={session.signUpCode}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={cn(
                      "transition-colors",
                      errors.signUpCode &&
                      "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.signUpCode && (
                    <p
                      className="text-sm text-destructive flex items-center gap-1"
                      role="alert"
                      aria-live="assertive"
                    >
                      <X className="h-3 w-3" />
                      {errors.signUpCode}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  {t("createCourse.scheduleInformation")}
                </CardTitle>
                <CardDescription>
                  {t("createCourse.scheduleInformationDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="year" className="text-sm font-medium capitalize">
                        {t("createCourse.year")}
                      </Label>
                      <TooltipWrapper content={t("createCourse.yearDescription")}>
                        <button type="button" aria-label={t("createCourse.yearDescription")}>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </button>
                      </TooltipWrapper>
                    </div>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      placeholder="2026"
                      value={session.year}
                      onChange={handleChange}
                      disabled={isLoading}
                      min={2020}
                      max={2040}
                      inputMode="numeric"
                      className={cn(
                        "transition-colors",
                        errors.year &&
                        "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {errors.year && (
                      <p
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                        aria-live="assertive"
                      >
                        <X className="h-3 w-3" />
                        {errors.year}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="term" className="text-sm font-medium">
                        {t("createCourse.term")}
                      </Label>
                      <TooltipWrapper content={t("createCourse.termDescription")}>
                        <button type="button" aria-label={t("createCourse.termDescription")}>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </button>
                      </TooltipWrapper>
                    </div>
                    <Select
                      value={session.term}
                      onValueChange={handleTermChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        className={cn(
                          "transition-colors",
                          errors.term &&
                          "border-destructive focus-visible:ring-destructive"
                        )}
                        aria-label={t("createCourse.selectTerm")}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder={t("createCourse.selectTerm")} />
                      </SelectTrigger>
                      <SelectContent aria-label={t("createCourse.selectTerm")}>
                        <SelectItem value="spring">{t("components.spring")}</SelectItem>
                        <SelectItem value="summer">{t("components.summer")}</SelectItem>
                        <SelectItem value="fall">{t("components.fall")}</SelectItem>
                        <SelectItem value="winter">{t("components.winter")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.term && (
                      <p
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                        aria-live="assertive"
                      >
                        <X className="h-3 w-3" />
                        {errors.term}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="section" className="text-sm font-medium">
                        {t("createCourse.sectionPeriod")}
                      </Label>
                      <TooltipWrapper content={t("createCourse.sectionPeriodDescription")}>
                        <button type="button" aria-label={t("createCourse.sectionPeriodDescription")}>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </button>
                      </TooltipWrapper>
                    </div>
                    <Input
                      id="section"
                      name="section"
                      placeholder={t("createCourse.sectionPeriodHelpText")}
                      value={session.section}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={cn(
                        "transition-colors",
                        errors.section &&
                        "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {errors.section && (
                      <p
                        className="text-sm text-destructive flex items-center gap-1"
                        role="alert"
                        aria-live="assertive"
                      >
                        <X className="h-3 w-3" />
                        {errors.section}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teaching Assistants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  {t("createCourse.teachingAssistants")}
                </CardTitle>
                <CardDescription>
                  {t("createCourse.teachingAssistantsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.taList.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      {t("createCourse.selectedTeachingAssistants")}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {session.taList.map(
                        (ta: CustomUserType, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-sm py-2 px-3 flex items-center gap-2 bg-purple-900 text-purple-100 hover:bg-purple-900 hover:text-white"
                          >
                            {ta.name && ta.family_name
                              ? `${ta.name} ${ta.family_name}`
                              : ta.name ||
                              ta.family_name ||
                              ta.email ||
                              ta.username}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-1 hover:bg-red-500 hover:text-white rounded-full"
                              aria-label={t("createCourse.removeTA")}
                              onClick={() => {
                                const newTaList = session.taList.filter(
                                  (_: CustomUserType, i: number) => i !== index
                                );
                                setSession((prev) => ({
                                  ...prev,
                                  taList: newTaList,
                                }));
                              }}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label id="taLabel" htmlFor="taSelect" className="text-sm font-medium">
                    {t("common.add")} {t("createCourse.teachingAssistants")}
                  </Label>
                  <Popover open={openTaPopover} onOpenChange={setOpenTaPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        id="taSelect"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTaPopover}
                        aria-labelledby="taLabel"
                        className="group w-full justify-between font-normal hover:bg-accent hover:text-accent-foreground h-10 px-3"
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Users className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground shrink-0 transition-colors" />
                          <span className="truncate">
                            {t("createCourse.selectTeachingAssistant")}
                          </span>
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder={t("common.search")}
                          value={taSearchQuery}
                          onChange={(e) => setTaSearchQuery(e.target.value)}
                        />
                      </div>
                      <ScrollArea className="h-72">
                        <div className="p-1">
                          {userList.filter(
                            (user) =>
                              !session.taList.find(
                                (ta: CustomUserType) =>
                                  ta.username === user.username
                              ) &&
                              (`${user.name || ""} ${user.family_name || ""} ${user.email || ""} ${user.username || ""}`
                                .toLowerCase()
                                .includes(taSearchQuery.toLowerCase()))
                          ).length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              {t("createCourse.noMoreUsersAvailable")}
                            </div>
                          ) : (
                            userList
                              .filter(
                                (user) =>
                                  !session.taList.find(
                                    (ta: CustomUserType) =>
                                      ta.username === user.username
                                  ) &&
                                  (`${user.name || ""} ${user.family_name || ""} ${user.email || ""} ${user.username || ""}`
                                    .toLowerCase()
                                    .includes(taSearchQuery.toLowerCase()))
                              )
                              .map((user) => (
                                <button
                                  key={user.username}
                                  type="button"
                                  className="group relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                  onClick={() => {
                                    if (session.taList.length >= 10) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        taList: t("createCourse.maxTeachingAssistants"),
                                      }));
                                    } else {
                                      setSession((prev) => ({
                                        ...prev,
                                        taList: [...prev.taList, user],
                                      }));
                                      setErrors((prev) => ({ ...prev, taList: "" }));
                                    }
                                    setOpenTaPopover(false);
                                    setTaSearchQuery("");
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>
                                      {user.name && user.family_name
                                        ? `${user.name} ${user.family_name}`
                                        : user.name ||
                                        user.family_name ||
                                        user.email ||
                                        user.username}
                                    </span>
                                    {user.email &&
                                      (user.name || user.family_name) && (
                                        <span>
                                          ({user.email})
                                        </span>
                                      )}
                                  </div>
                                </button>
                              ))
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                {errors.taList !== "" && (
                  <p
                    className="text-sm text-destructive flex items-center gap-1"
                    role="alert"
                    aria-live="assertive"
                  >
                    <X className="h-3 w-3" />
                    {errors.taList}
                  </p>
                )}

                <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 colorful-dark:bg-gray-800 p-3 rounded-md">
                  <p className="text-xs">
                    <strong>{t("createCourse.note")}:</strong> {t("createCourse.teachingAssistantsNote")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Bottom Actions */}
          <section aria-labelledby="bottom-actions-heading" className="pt-4">
            <nav
              className="flex flex-col md:flex-row md:items-center md:justify-end gap-2"
              aria-label={
                isEditMode
                  ? `${t("courses.editCourse")} ${t("common.actions")}}`
                  : `${t("createCourse.createCourse")} ${t("common.actions")}}`
              }
              id="bottom-actions-heading"
            >
              {isEditMode && (
                <TooltipWrapper content={t("createCourse.deleteCourse")}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenDeleteModal(true)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    aria-label={t("createCourse.deleteCourse")}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t("common.delete")}
                  </Button>
                </TooltipWrapper>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSavePublishTooltip(true)}
                aria-label={t("createCourse.getSavePublishHelp")}
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                {t("common.info")}
              </Button>
              <div className="flex rounded-lg border">
                <Button
                  size="sm"
                  onClick={(e) => {
                    if (selectedIndexSave === 0) {
                      handleSubmit(e, true, false);
                    } else if (selectedIndexSave === 1) {
                      if (isEditMode && session.isActive) {
                        setOpenActiveModal(true);
                      } else {
                        handleSubmit(e, false, false);
                      }
                    } else if (selectedIndexSave === 2) {
                      setOpenDiscardModal(true);
                    }
                  }}
                  className="rounded-none border-0 w-full rounded-l"
                  disabled={isLoading}
                  aria-label={`${options[selectedIndexSave]} ${t("components.courses")}`}
                >
                  {options[selectedIndexSave]}
                </Button>
                <DropdownWrapper
                  open={openSaveBottom}
                  onOpenChange={setOpenSaveBottom}
                  trigger={
                    <Button
                      size="sm"
                      className="rounded-none border-0 border-l px-2 rounded-r"
                      variant="default"
                      disabled={isLoading}
                      aria-label={t("createModule.saveStrategy")}
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  }
                  actions={options.map((option, index) => ({
                    label: option,
                    onClick: () => {
                      const fakeEvent = {} as React.MouseEvent<
                        HTMLDivElement,
                        MouseEvent
                      >;
                      handleMenuItemClick(fakeEvent, index);
                    },
                    className: cn(
                      index === selectedIndexSave && "bg-primary/30",
                      index === 2 &&
                      "text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    ),
                  }))}
                  align="end"
                />
              </div>
            </nav>
          </section>
        </div>
      ) : (
        <div className="bg-background text-foreground p-4">
          <div
            className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
            role="status"
          >
            <XCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t("courses.courseNotFound")}</p>
            <p className="text-sm">
              {t("createCourse.courseNotFoundDescription")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
