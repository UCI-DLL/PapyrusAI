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
import { useNavigate } from "react-router";
import { Star, BookOpen, Calendar, User, MoreHorizontal } from "lucide-react";
import { UserContext } from "../utility/context/UserContext";
import { AlertContext } from "../utility/context/AlertContext";
import { CourseType } from "../utility/types/CourseTypes";
import Post from "../utility/Post";
import { postCopyCourse } from "../utility/endpoints/CourseEndpoints";
import { Checkbox } from "./Checkbox";
import Put from "../utility/Put";
import {
    postCreateUserFavoritingData,
    putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import { Label } from "./ui/label";

interface CourseListProps {
    course: CourseType;
    refreshList: () => void;
    keyy: number | string;
    onClick?: (courseId: string) => void;
    isStarred?: boolean;
}

export default function CourseCard({
    course,
    refreshList,
    keyy,
    onClick,
    isStarred,
}: CourseListProps): JSX.Element {
    let navigator = useNavigate();
    const { user } = useContext(UserContext);
    const { setAlert } = useContext(AlertContext);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [openDuplicateModal, setOpenDuplicateModal] =
        useState<boolean>(false);
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

    function editCourse(courseId: string) {
        navigator(`/editcourse/${courseId}`);
    }

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

    const ownerMenu = ["Edit Course", "Duplicate"];
    const ownerMenuFunctions = [editCourse, duplicateCourse];
    const nonOwnerMenu = ["Duplicate"];
    const nonOwnerMenuFunctions = [duplicateCourse];

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

    return course && user ? (
        <div>
            <Dialog
                open={openDuplicateModal}
                onOpenChange={setOpenDuplicateModal}
            >
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>Duplicate Course</DialogTitle>
                        <DialogDescription>
                            Enter a name and a unique sign up code for the
                            duplicated course. Duplicating a course will also
                            copy over all the modules and settings within this
                            course.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                New Course Name
                            </Label>
                            <Input
                                name="name"
                                placeholder="Enter new course name"
                                value={duplicateCourseData.name}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                New Course Sign Up Code
                            </Label>
                            <Input
                                name="signUpCode"
                                placeholder="Enter new sign up code"
                                value={duplicateCourseData.signUpCode}
                                onChange={handleChange}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Checkbox
                            onClick={() => {
                                setDuplicateCourseData((prev) => ({
                                    ...prev,
                                    isActive: !duplicateCourseData.isActive,
                                }));
                            }}
                            checked={duplicateCourseData.isActive}
                            isDisabled={isLoading}
                        >
                            <span>Publish Course</span>
                        </Checkbox>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setOpenDuplicateModal(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDuplicateCourse}
                            disabled={isLoading}
                            className="hover:bg-primary/10 hover:text-primary"
                        >
                            Duplicate
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="group bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl hover-lift shadow-sm relative h-40 flex flex-col">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-5 overflow-hidden rounded-xl">
                    <BookOpen size={80} className="transform rotate-12" />
                </div>

                {/* Content Area with Padding */}
                <div className="p-4 flex flex-col flex-1 relative z-10">
                    {/* Header */}
                    <div className="relative z-10 flex items-start justify-between mb-3 flex-shrink-0">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                                {course.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Calendar size={10} />
                                    <span className="font-medium">
                                        {course.section
                                            ? `${course.term || ""} ${
                                                  course.year || ""
                                              } - ${course.section}`
                                            : `${course.term || ""} ${
                                                  course.year || ""
                                              }`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <User size={10} />
                                    <span className="font-medium truncate">
                                        {`${course.instructor.name} ${course.instructor.family_name}`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            {/* Star Button */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={(e: any) => {
                                                e.stopPropagation();
                                                starred
                                                    ? removeStarredCourse(
                                                          course.id
                                                      )
                                                    : createStarredCourse(
                                                          course.id
                                                      );
                                            }}
                                            disabled={isLoading}
                                            className={`p-1 rounded-full transition-all duration-300 ${
                                                starred
                                                    ? "text-yellow-500 bg-yellow-50"
                                                    : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                                            }`}
                                        >
                                            <Star
                                                size={12}
                                                fill={
                                                    starred
                                                        ? "currentColor"
                                                        : "none"
                                                }
                                            />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="z-50 text-black"
                                    >
                                        {starred
                                            ? "Unstar Course"
                                            : "Star Course"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Dropdown Menu */}
                            {user.groups.includes(course.id) &&
                                !onClick &&
                                (user?.groups.includes(
                                    process.env.REACT_APP_ADMIN
                                        ? process.env.REACT_APP_ADMIN
                                        : "PapyrusAIAdmins"
                                ) ||
                                    user?.groups.includes(
                                        process.env.REACT_APP_INSTRUCTOR
                                            ? process.env.REACT_APP_INSTRUCTOR
                                            : "PapyrusAIInstructors"
                                    ) ||
                                    user?.groups.includes(
                                        course.id + "-TA"
                                    )) && (
                                    <DropdownMenu
                                        open={menuOpen}
                                        onOpenChange={setMenuOpen}
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <button
                                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-300"
                                                            onClick={(
                                                                e: any
                                                            ) => {
                                                                e.stopPropagation();
                                                            }}
                                                        >
                                                            <MoreHorizontal
                                                                size={12}
                                                            />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="top"
                                                    className="z-50 text-black"
                                                >
                                                    Course Options
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <DropdownMenuContent align="end">
                                            {course.instructor.username ===
                                            user.username
                                                ? ownerMenu.map(
                                                      (
                                                          item: string,
                                                          index: number
                                                      ) => (
                                                          <DropdownMenuItem
                                                              key={index}
                                                              onClick={() => {
                                                                  ownerMenuFunctions[
                                                                      index
                                                                  ](course.id);
                                                              }}
                                                              className="cursor-pointer text-primary"
                                                          >
                                                              {item}
                                                          </DropdownMenuItem>
                                                      )
                                                  )
                                                : nonOwnerMenu.map(
                                                      (
                                                          item: string,
                                                          index: number
                                                      ) => (
                                                          <DropdownMenuItem
                                                              key={index}
                                                              onClick={() => {
                                                                  nonOwnerMenuFunctions[
                                                                      index
                                                                  ](course.id);
                                                              }}
                                                              className="cursor-pointer text-primary"
                                                          >
                                                              {item}
                                                          </DropdownMenuItem>
                                                      )
                                                  )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                        </div>
                    </div>

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1"></div>

                    {/* Action Button */}
                    <Button
                        onClick={
                            onClick
                                ? () => onClick(course.id)
                                : () =>
                                      navigator(`/courses/${course.id}/modules`)
                        }
                        variant="default"
                        size="sm"
                        className="relative z-10 flex-shrink-0 w-full flex items-center justify-center gap-2 hover:bg-primary/10 hover:text-primary"
                    >
                        <BookOpen size={14} />
                        {onClick ? "Select" : "View Modules"}
                    </Button>
                </div>
            </div>
        </div>
    ) : (
        <div className="text-center py-8 text-muted-foreground">
            No available courses
        </div>
    );
}
