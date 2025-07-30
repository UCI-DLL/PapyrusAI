import React, { useEffect, useState, useContext } from "react";
import CourseList from "../course-groups/CourseList";
import ModuleList from "../modules/ModuleList";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Progress } from "../../components/ui/progress";
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
import { ExternalLink, EyeIcon, PlusIcon } from "lucide-react";
import { Dialog, DialogTrigger } from "../../components/ui/dialog";

export default function Dashboard(): JSX.Element {
    let navigator = useNavigate();
    const { user } = useContext(UserContext);
    const { setAlert } = useContext(AlertContext);
    const [courseList, setCourseList] = useState<Array<CourseType>>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showAddCourseModal, setShowAddCourseModal] =
        useState<boolean>(false);
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
                        message:
                            "Encountered an error. Please try again later.",
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

    function refreshList() {
        const controller = new AbortController();
        getCourses(controller.signal);
        getStarred(controller.signal);
    }

    return !isLoading ? (
        <div className="bg-background text-foreground p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4 shadow-md p-4 rounded-lg bg-white">
                <h1 className="text-2xl font-extrabold text-black">
                    Welcome back,{" "}
                    <span className="text-primary font-bold text-2xl">
                        {user?.name}
                    </span>
                </h1>
            </div>

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                        <h3 className="text-2xl font-extrabold text-black">
                            My Courses
                        </h3>
                        <div className="flex gap-2">
                            Continue your learning journey
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator("/courses")}
                        >
                            <EyeIcon className="w-4 h-4" />
                            View All
                        </Button>
                        {user?.groups.includes(
                            process.env.REACT_APP_INSTRUCTOR
                                ? process.env.REACT_APP_INSTRUCTOR
                                : "PapyrusAIInstructors"
                        ) && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigator("/createcourse")}
                            >
                                <PlusIcon className="w-4 h-4" />
                                Create Course
                            </Button>
                        )}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    className="hover:bg-primary/10 hover:text-primary"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Join Course
                                </Button>
                            </DialogTrigger>
                            <AddCourseForm
                                closeForm={() => {
                                    setShowAddCourseModal(false);
                                }}
                            />
                        </Dialog>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    {courseList.length > 0 ? (
                        <CourseList
                            list={orderCourseRecentlyCreatedAndStarred(
                                courseList,
                                starred && starred.courses
                                    ? starred.courses
                                    : []
                            ).slice(0, 6)}
                            refreshList={refreshList}
                            starredList={
                                starred && starred.courses
                                    ? starred.courses
                                    : []
                            }
                        />
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="mb-2">
                                No courses added yet. To join a course, click
                                "Join Course" at the top right.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-row items-center justify-between gap-2">
                    <div>
                        <h3 className="text-2xl font-extrabold text-black">
                            Recent Modules
                        </h3>
                        <div className="flex gap-2">
                            Pick up where you left off
                        </div>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator("/modules")}
                    >
                        <EyeIcon className="w-4 h-4" />
                        View All
                    </Button>
                </div>
                <div className="flex flex-col gap-2">
                    {courseList.length > 0 &&
                        mostRecentModules(
                            orderCourseRecentlyCreatedAndStarred(
                                courseList,
                                starred && starred.courses
                                    ? starred.courses
                                    : []
                            )
                        ).map((course, index) => {
                            return course.modules.length > 0 ? (
                                <div className="w-full mb-6" key={index}>
                                    <ModuleList
                                        course={{
                                            ...course,
                                            modules: course.mostRecentItem
                                                ? [course.mostRecentItem]
                                                : [],
                                        }}
                                        refreshList={refreshList}
                                        starredList={
                                            starred ? starred : undefined
                                        }
                                    />
                                    <Separator className="mt-4" />
                                </div>
                            ) : null;
                        })}
                </div>
            </div>
        </div>
    ) : (
        <div className="p-6 h-100">
            <Progress className="w-full" />
        </div>
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
