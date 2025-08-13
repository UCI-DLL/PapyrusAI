import { useContext, useEffect, useState } from "react";
import type { CourseType } from "../../utility/types/CourseTypes";
import CourseCard from "../../components/CourseCard";
import { orderCourseRecentlyCreatedAndStarred } from "../../utility/Helpers";
import { UserContext } from "../../utility/context/UserContext";

interface CourseListProps {
    list: Array<CourseType>;
    refreshList: () => void;
    starredList: Array<{ courseId: string }>;
}

export default function CourseList({
    list,
    refreshList,
    starredList,
}: CourseListProps): JSX.Element {
    const { user } = useContext(UserContext);
    const [starred, setStarred] =
        useState<Array<{ courseId: string }>>(starredList);

    useEffect(() => {
        setStarred(starredList);
    }, [starredList]);

    return list.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full" role="list" aria-label="Course list">
            {orderCourseRecentlyCreatedAndStarred(list, starred).map(
                (course) => (
                    <div key={course.id} role="listitem">
                        <CourseCard
                            course={course}
                            refreshList={refreshList}
                            isStarred={starredList.some(
                                (x) => x.courseId === course.id
                            )}
                        />
                    </div>
                )
            )}
        </section>
    ) : (
        <div className="text-center py-8 text-muted-foreground" role="status">
            <p className="mb-2">
                No courses added yet. To join a course, click "Join Course" above.
            </p>
            {user?.groups.includes(
                process.env.REACT_APP_INSTRUCTOR
                    ? process.env.REACT_APP_INSTRUCTOR
                    : "PapyrusAIInstructors"
            ) ? (
                <p>
                    To create a course, click "Create Course" above.
                </p>
            ) : (
                <p>
                    Then, use the code your instructor gave you to join their course.
                </p>
            )}
        </div>
    );
}
