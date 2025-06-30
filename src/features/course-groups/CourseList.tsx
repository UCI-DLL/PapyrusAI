import React, { useContext, useEffect, useState } from "react";
import { CourseType } from "../../utility/types/CourseTypes";
import CourseCard from "../../components/CourseCard";
import { orderCourseRecentlyCreatedAndStarred } from "../../utility/Helpers";
import { UserContext } from "../../utility/context/UserContext";

interface CourseListProps {
  list: Array<CourseType>;
  refreshList: () => void;
  starredList: Array<{ courseId: string }>;
}

export default function CourseList({ list, refreshList, starredList }: CourseListProps): JSX.Element {
  const { user } = useContext(UserContext);
  const [starred, setStarred] = useState<Array<{ courseId: string }>>(starredList);

  useEffect(() => {
    setStarred(starredList)
    // eslint-disable-next-line
  }, [starredList]);


  return list.length > 0 ? (
    <div className="courses__list">
      {/*  pin starred courses to top of list */}
      {orderCourseRecentlyCreatedAndStarred(list, starred).map((course, index) => {
        return (
          <div key={index}>
            <CourseCard
              course={course}
              keyy={index}
              refreshList={refreshList}
              isStarred={starredList.some(x => x.courseId === course.id)}
            />
          </div>
        )
      })}
    </div>
  ) : (
    <div>
      No courses added yet. To join a course, click “Join Course” at the top right.
      {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ?
        " To create a course, click “Create Course” at the top right." :
        " Then, use the code your instructor gave you to join their course."}
    </div>
  )
}