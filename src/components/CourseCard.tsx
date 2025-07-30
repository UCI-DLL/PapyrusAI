import { useContext, useEffect, useState } from "react";
import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
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
import { MoreVertical, Star } from "lucide-react";
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

    const StarredComponents = () =>
        starred ? (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isLoading}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            removeStarredCourse(course.id);
                        }}
                    >
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Unstar Course</TooltipContent>
            </Tooltip>
        ) : (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isLoading}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            createStarredCourse(course.id);
                        }}
                    >
                        <Star className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Star Course</TooltipContent>
            </Tooltip>
        );

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

            <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold text-primary">
                            {course.name}
                        </CardTitle>
                        <CardDescription className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                                {course.section
                                    ? `${course.term ? course.term : ""} ${
                                          course.year ? course.year : ""
                                      } - ${course.section}`
                                    : `${course.term ? course.term : ""} ${
                                          course.year ? course.year : ""
                                      }`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {`Instructor: ${course.instructor.name} ${course.instructor.family_name}`}
                            </div>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <StarredComponents />
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
                                user?.groups.includes(course.id + "-TA")) && (
                                <DropdownMenu
                                    open={menuOpen}
                                    onOpenChange={setMenuOpen}
                                >
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e: any) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Course Options
                                        </TooltipContent>
                                    </Tooltip>
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
                </CardHeader>
                <CardFooter className="pt-0">
                    {onClick ? (
                        <Button
                            size="sm"
                            onClick={() => onClick(course.id)}
                            className="w-full hover:bg-primary/10 hover:text-primary"
                        >
                            Select
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() =>
                                navigator(`/courses/${course.id}/modules`)
                            }
                            className="w-full hover:bg-primary/10 hover:text-primary"
                        >
                            Modules
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    ) : (
        <div className="text-center py-8 text-muted-foreground">
            No available courses
        </div>
    );
}
