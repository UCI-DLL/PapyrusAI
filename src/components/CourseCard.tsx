import { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useNavigate, Link } from "react-router-dom";
import { Star, BookOpen, Calendar, User, MoreHorizontal } from "lucide-react";
import { UserContext } from "../utility/context/UserContext";
import { AlertContext } from "../utility/context/AlertContext";
import { CourseType } from "../utility/types/CourseTypes";
import Post from "../utility/Post";
import { postCopyCourse } from "../utility/endpoints/CourseEndpoints";
import { Checkbox } from "./ui/checkbox";
import Put from "../utility/Put";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";

interface CourseListProps {
  course: CourseType;
  refreshList: () => void;
  onClick?: (courseId: string) => void;
  isStarred?: boolean;
}

export default function CourseCard({
  course,
  refreshList,
  onClick,
  isStarred,
}: CourseListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openDuplicateModal, setOpenDuplicateModal] = useState<boolean>(false);
  const [duplicateCourseData, setDuplicateCourseData] = useState<{
    name: string;
    signUpCode: string;
    isActive: boolean;
  }>({
    name: "",
    signUpCode: "",
    isActive: false,
  });
  const [starred, setStarred] = useState<boolean>(
    isStarred ? isStarred : false
  );
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setStarred(isStarred ? isStarred : false);
  }, [isStarred]);

  function duplicateCourse(courseId: string) {
    setMenuOpen(false);
    setOpenDuplicateModal(true);
  }

  function handleDuplicateCourse() {
    setIsLoading(true);
    Post(postCopyCourse(course.id), duplicateCourseData).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          setOpenDuplicateModal(false);
          setAlert({
            message: "Course Duplicated",
            type: "success",
          });
          setDuplicateCourseData({
            name: "",
            signUpCode: "",
            isActive: false,
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: res.data, type: "error" });
      }
      refreshList();
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDuplicateCourseData({
      ...duplicateCourseData,
      [e.target.name]: e.target.value,
    });
  }

  const ownerMenu = [
    {
      label: "Edit Course",
      type: "link" as const,
      action: `/editcourse/${course.id}`,
    },
    { label: "Duplicate", type: "function" as const, action: duplicateCourse },
  ];
  const nonOwnerMenu = [
    { label: "Duplicate", type: "function" as const, action: duplicateCourse },
  ];

  function createStarredCourse(courseId: string) {
    setIsLoading(true);
    Post(postCreateUserFavoritingData(), {
      id: { courseId: courseId },
      type: "courses",
    }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.courses) {
          setStarred(res.data.courses);
          setAlert({
            message: "Course added to favorites.",
            type: "info",
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: res.data, type: "error" });
      }
      refreshList();
    });
  }

  function removeStarredCourse(courseId: string) {
    setIsLoading(true);
    Put(putUpdateUserFavoritingData(), {
      id: { courseId: courseId },
      type: "courses",
    }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.courses) {
          setStarred(res.data.courses);
          setAlert({
            message: "Course removed from favorites.",
            type: "info",
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: res.data, type: "error" });
      }
      refreshList();
    });
  }

  if (!course || !user) {
    return (
      <div className="text-center py-8 text-muted-foreground" role="status">
        No available courses
      </div>
    );
  }

  return (
    <>
      <Dialog open={openDuplicateModal} onOpenChange={setOpenDuplicateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Course</DialogTitle>
            <DialogDescription>
              Enter a name and a unique sign up code for the duplicated course.
              Duplicating a course will also copy over all the modules and
              settings within this course.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleDuplicateCourse();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="course-name" className="text-sm font-medium">
                New Course Name
              </Label>
              <Input
                id="course-name"
                name="name"
                placeholder="Enter new course name"
                value={duplicateCourseData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
                aria-describedby="course-name-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-code" className="text-sm font-medium">
                New Course Sign Up Code
              </Label>
              <Input
                id="signup-code"
                name="signUpCode"
                placeholder="Enter new sign up code"
                value={duplicateCourseData.signUpCode}
                onChange={handleChange}
                required
                disabled={isLoading}
                aria-describedby="signup-code-description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="publish-course"
                checked={duplicateCourseData.isActive}
                onCheckedChange={(checked) => {
                  setDuplicateCourseData((prev) => ({
                    ...prev,
                    isActive: checked === true,
                  }));
                }}
                disabled={isLoading}
              />
              <Label
                htmlFor="publish-course"
                className="text-sm font-medium leading-none"
              >
                Publish Course
              </Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDuplicateModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Duplicate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <article className="group bg-card border rounded-xl hover-lift shadow-sm relative h-50 flex flex-col">
        <div
          className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden rounded-xl"
          aria-hidden="true"
        >
          <BookOpen size={80} className="transform rotate-12" />
        </div>

        <div className="p-4 flex flex-col flex-1 relative z-10">
          <header className="relative z-10 flex items-start justify-between mb-3 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                {course.name}
              </h3>
              <div className="flex flex-col my-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar size={10} aria-hidden="true" />
                  <span className="font-medium text-sm capitalize">
                    {course.section
                      ? `${course.term || ""} ${course.year || ""} - ${
                          course.section
                        }`
                      : `${course.term || ""} ${course.year || ""}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <User size={10} aria-hidden="true" />
                  <span className="font-medium text-sm truncate">
                    Instructor:{" "}
                    {`${course.instructor.name} ${course.instructor.family_name}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {course.modules.length}{" "}
                  {course.modules.length === 1 ? "Module" : "Modules"}
                </div>
              </div>
            </div>

            <nav
              className="flex items-center gap-1 ml-2 flex-shrink-0"
              aria-label="Course actions"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    onClick={(e) => {
                      e.stopPropagation();
                      starred
                        ? removeStarredCourse(course.id)
                        : createStarredCourse(course.id);
                    }}
                    disabled={isLoading}
                    className={cn(
                      "p-1 rounded-full transition-all duration-300",
                      starred
                        ? "text-gold hover:text-muted"
                        : "text-muted hover:text-gold"
                    )}
                    aria-label={
                      starred ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    <Star
                      size={12}
                      fill={starred ? "currentColor" : "none"}
                      className={cn(
                        starred ? "hover:fill-none" : "hover:fill-current"
                      )}
                      aria-hidden="true"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {starred ? "Unstar Course" : "Star Course"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {user.groups.includes(course.id) &&
                !onClick &&
                (user?.groups.includes(
                  process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmins"
                ) ||
                  user?.groups.includes(
                    process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors"
                  ) ||
                  user?.groups.includes(course.id + "-TA")) && (
                  <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger
                            className="p-1 text-primary hover:text-primary-foreground hover:bg-accent rounded-full transition-all duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            aria-label="Course options menu"
                          >
                            <MoreHorizontal size={12} aria-hidden="true" />
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Course Options
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end">
                      {(course.instructor.username === user.username
                        ? ownerMenu
                        : nonOwnerMenu
                      ).map((item) =>
                        item.type === "link" ? (
                          <DropdownMenuItem key={item.label} asChild>
                            <Link
                              to={item.action}
                              className="cursor-pointer text-primary no-underline"
                            >
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            key={item.label}
                            onClick={() => {
                              item.action(course.id);
                            }}
                            className="cursor-pointer text-primary"
                          >
                            {item.label}
                          </DropdownMenuItem>
                        )
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </nav>
          </header>

          <div className="flex-1" aria-hidden="true"></div>

          {onClick ? (
            <Button
              onClick={() => onClick(course.id)}
              variant="default"
              size="sm"
              className="relative z-10 flex-shrink-0 w-full flex items-center justify-center gap-2"
              aria-label={`Select ${course.name}`}
            >
              <BookOpen size={14} aria-hidden="true" />
              Select
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              asChild
              className="relative z-10 flex-shrink-0 w-full hover:bg-primary/90 hover:text-primary-foreground"
              aria-label={`View modules for ${course.name}`}
            >
              <Link
                to={`/courses/${course.id}/modules`}
                className="flex items-center justify-center gap-2 no-underline"
              >
                <BookOpen size={14} aria-hidden="true" />
                View Modules
              </Link>
            </Button>
          )}
        </div>
      </article>
    </>
  );
}
