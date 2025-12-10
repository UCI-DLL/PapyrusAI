import { useContext, useEffect, useState } from "react";
import type { CourseType } from "../../utility/types/CourseTypes";
import CourseCard from "../../components/CourseCard";
import { orderCourseRecentlyCreatedAndStarred } from "../../utility/Helpers";
import { UserContext } from "../../utility/context/UserContext";
import { BookOpen } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

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
    const { t } = useTranslation();
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
        <div 
            className="text-center py-12 text-muted-foreground bg-card border rounded-lg" 
            role="status"
        >
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t("courses.noCoursesFound")}</p>
            <p className="text-sm mb-2">
                {t("courses.noCoursesAdded")}
            </p>
            {user?.groups.includes(
                process.env.REACT_APP_INSTRUCTOR
                    ? process.env.REACT_APP_INSTRUCTOR
                    : "PapyrusAIInstructors"
            ) ? (
                <p className="text-sm">
                    {t("courses.createCoursePrompt")}
                </p>
            ) : (
                <p className="text-sm">
                    {t("courses.joinCoursePrompt")}
                </p>
            )}
        </div>
    );
}
