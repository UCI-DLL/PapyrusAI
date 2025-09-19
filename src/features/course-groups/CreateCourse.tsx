import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  ChevronDown,
  Info,
  Loader2,
  X,
  BookOpen,
  Users,
  Calendar,
  Hash,
  Clock,
} from "lucide-react";
import { postCreateCourse } from "../../utility/endpoints/CourseEndpoints";
import Post from "../../utility/Post";
import { AlertContext } from "../../utility/context/AlertContext";
import Get from "../../utility/Get";
import { getUserList } from "../../utility/endpoints/UserEndpoints";
import { CustomUserType, UserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { cn } from "../../lib/utils";

type AddCourseType = {
  name: string;
  signUpCode: string;
  isActive: boolean;
  year: string;
  section: string;
  term: string;
  taList: any;
};

const options = [
  "Save & Publish",
  "Save without Publishing",
  "Discard Changes",
];

export default function CreateCourse(): JSX.Element {
  let navigator = useNavigate();
  const [session, setSession] = useState<AddCourseType>({
    name: "",
    signUpCode: "",
    isActive: false,
    year: "",
    section: "",
    term: "",
    taList: [],
  });
  const [errors, setErrors] = useState<AddCourseType>({
    name: "",
    signUpCode: "",
    isActive: false,
    year: "",
    section: "",
    term: "",
    taList: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [userList, setUserList] = useState<Array<CustomUserType>>([]);
  const { user, setUser } = useContext(UserContext);
  const [openSave, setOpenSave] = useState(false);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] =
    useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    if (userList.length === 0) {
      getUsers("", controller.signal);
    } else {
      setIsLoading(false);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function handleClick(e: any) {
    if (selectedIndexSave === 0) {
      //Save and publish
      handleSubmit(e, true);
    } else if (selectedIndexSave === 1) {
      //save and not publish
      handleSubmit(e, false);
    } else if (selectedIndexSave === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
  }

  const handleMenuItemClick = (index: number) => {
    if (index === 0) {
      //Save and publish
      handleSubmit(null, true);
    } else if (index === 1) {
      //save and not publish
      handleSubmit(null, false);
    } else if (index === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSave(false);
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
      setIsLoading(false);
    });
  }

  function handleSubmit(e: any, isActive = false) {
    if (e) e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Name missing" }));
    } else if (session.signUpCode === "") {
      setErrors((prev) => ({ ...prev, signUpCode: "Sign up code missing" }));
    } else {
      //create course
      // set is loading
      setIsLoading(true);
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
            setAlert({ message: "Course Created", type: "success" });
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleTermChange(value: string) {
    setSession((prev) => ({ ...prev, term: value }));
  }

  return !isLoading ? (
    <div className="min-h-screen">
      {/* Dialogs */}
      <Dialog
        open={showSavePublishTooltip}
        onOpenChange={setShowSavePublishTooltip}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 " />
              What is Save & Publish?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-3">
            <p>
              To save and publish (i.e., make visible to students) your course,
              select <strong>"Save & Publish"</strong>.
            </p>
            <p>
              If you want to save your course without publishing the course,
              select <strong>"Save without Publishing"</strong>.
            </p>
            <p className="text-amber-600 dark:text-amber-500 text-sm">
              <strong>Note:</strong> Choosing this option after the course has
              already been published will unpublish the course.
            </p>
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setShowSavePublishTooltip(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDiscardModal} onOpenChange={setOpenDiscardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Discard Changes?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you would like to discard the changes to this course?
            This action cannot be undone.
          </DialogDescription>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenDiscardModal(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => navigator(-1)}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
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
              <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                Create Course
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base leading-6">
                Set up a new course for your students to interact with
                AI-powered learning modules.
              </p>
            </div>
          </div>
        </header>

        {/* Actions Section */}
        <section aria-labelledby="actions-heading">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 id="actions-heading" className="text-2xl font-bold text-foreground mb-1">
                Course Setup
              </h2>
              <p className="text-muted-foreground text-sm">
                Configure your course settings and publish options.
              </p>
            </div>
            <nav
              className="flex flex-col md:flex-row gap-2"
              role="toolbar"
              aria-label="Course creation actions"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePublishTooltip(true)}
                aria-label="Get help with Save & Publish options"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                Help
              </Button>
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  size="sm"
                  onClick={handleClick}
                  className="rounded-none border-0"
                  disabled={isLoading}
                  aria-label={`${options[selectedIndexSave]} course`}
                >
                  {options[selectedIndexSave]}
                </Button>
                <DropdownMenu open={openSave} onOpenChange={setOpenSave}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="rounded-none border-0 border-l px-2"
                      variant="default"
                      disabled={isLoading}
                      aria-label="Select save and activation strategy"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {options.map((option, index) => (
                      <DropdownMenuItem
                        key={option}
                        onClick={() => handleMenuItemClick(index)}
                        className={cn(
                          index === selectedIndexSave && "bg-accent",
                          index === 2 &&
                            "text-destructive focus:text-destructive"
                        )}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>
          </header>

          {/* Info Section */}
          <Card className="border-primary/20 bg-primary/5 transition-all duration-300 hover:shadow-md">
            <CardContent className="pt-6">
              <p className="text-primary/80 text-sm leading-relaxed">
                Courses are spaces in which instructors can create and organize
                modules that allow students to interact with the AI. For more
                information on creating a course, please see the{" "}
                <a
                  href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.y2e0cshr9a50"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-2 hover:no-underline text-primary transition-colors duration-200"
                >
                  "Creating a Course" section of our instructor guide
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the essential details for your course. Fields marked with
                * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Course Name *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The name for your course that users will see upon
                        joining.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., English 190W: Communications in the Professional World"
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
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="signUpCode" className="text-sm font-medium">
                    Course Sign Up Code *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        The unique sign up code that users will use to join your
                        course. You can use any combination of letters and
                        numbers. This is case sensitive.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signUpCode"
                    name="signUpCode"
                    placeholder="e.g., FALL2024ENG190W"
                    value={session.signUpCode}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={cn(
                      "pl-10 transition-colors",
                      errors.signUpCode &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </div>
                {errors.signUpCode && (
                  <p className="text-sm text-destructive flex items-center gap-1">
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
                Schedule Information
              </CardTitle>
              <CardDescription>
                Specify when this course takes place to help organize your
                curriculum.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="year" className="text-sm font-medium">
                      Year
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The year in which your course is taking place.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    placeholder="2024"
                    value={session.year}
                    onChange={handleChange}
                    disabled={isLoading}
                    min={2020}
                    max={2030}
                    inputMode="numeric"
                    className={cn(
                      "transition-colors",
                      errors.year &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.year && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.year}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="term" className="text-sm font-medium">
                      Term
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The term in which your course is taking place.</p>
                      </TooltipContent>
                    </Tooltip>
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
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.term && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.term}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="section" className="text-sm font-medium">
                      Section / Period
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The section number or period for your course.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="section"
                    name="section"
                    placeholder="Section 02"
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
                    <p className="text-sm text-destructive flex items-center gap-1">
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
                Teaching Assistants
              </CardTitle>
              <CardDescription>
                Add teaching assistants who can help manage your course. They
                can create and edit modules but cannot delete or unpublish the
                course.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.taList.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Selected Teaching Assistants
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {session.taList.map((ta: CustomUserType, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm py-2 px-3 flex items-center gap-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        {ta.name} {ta.family_name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-red-500 hover:text-white rounded-full"
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
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="taSelect" className="text-sm font-medium">
                  Add Teaching Assistant
                </Label>
                <Select
                  onValueChange={(value) => {
                    const selectedUser = userList.find(
                      (user) => user.username === value
                    );
                    if (selectedUser) {
                      if (session.taList.length >= 10) {
                        setErrors((prev) => ({
                          ...prev,
                          taList: "Max 10 Teaching Assistants",
                        }));
                      } else if (
                        !session.taList.find(
                          (ta: CustomUserType) =>
                            ta.username === selectedUser.username
                        )
                      ) {
                        setSession((prev) => ({
                          ...prev,
                          taList: [...prev.taList, selectedUser],
                        }));
                        setErrors((prev) => ({ ...prev, taList: "" }));
                      }
                    }
                  }}
                >
                  <SelectTrigger id="taSelect">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a teaching assistant to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {userList.filter(
                      (user) =>
                        !session.taList.find(
                          (ta: CustomUserType) => ta.username === user.username
                        )
                    ).length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        No more users available to add
                      </div>
                    ) : (
                      userList
                        .filter(
                          (user) =>
                            !session.taList.find(
                              (ta: CustomUserType) =>
                                ta.username === user.username
                            )
                        )
                        .map((user) => (
                          <SelectItem key={user.username} value={user.username}>
                            <div className="flex items-center gap-2">
                              <span>
                                {user.name} {user.family_name}
                              </span>
                              <span className="text-muted-foreground">
                                ({user.email})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {errors.taList !== "" && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.taList}
                </p>
              )}

              <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <p>
                  <strong>Note:</strong> Teaching assistants can create and edit
                  modules for you, but not delete or unpublish the course. You
                  can assign multiple people to this role. To add someone as a
                  teaching assistant, they must already have a PapyrusAI
                  account.
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  ) : (
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
        <p className="text-muted-foreground">Loading course creation form...</p>
      </div>
    </div>
  );
}
