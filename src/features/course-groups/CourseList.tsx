import React, { useContext } from "react";
import { CourseType } from "../../utility/types/CourseTypes";
import CourseCard from "../../components/CourseCard";
import { orderCourseRecentlyCreated } from "../../utility/Helpers";
import { UserContext } from "../../utility/context/UserContext";

interface CourseListProps {
  list: Array<CourseType>;
  refreshList: () => void;
}

export default function CourseList({ list, refreshList }: CourseListProps): JSX.Element {
  const { user } = useContext(UserContext);
  return list.length > 0 ? (
    <div className="courses__list">
      {orderCourseRecentlyCreated(list).map((course, index) => {
        return (
          <div key={index}>
            <CourseCard course={course} keyy={index} refreshList={refreshList} />
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