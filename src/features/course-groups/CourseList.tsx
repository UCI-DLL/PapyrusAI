import React from "react";
import { CourseType } from "../../utility/types/CourseTypes";
import CourseCard from "../../components/CourseCard";

interface CourseListProps {
  list: Array<CourseType>;
  refreshList: () => void;
}

export default function CourseList({ list, refreshList }: CourseListProps): JSX.Element {
  return list.length > 0 ? (
    <div className="courses__list">
      {list.map((course, index) => {
        return (
          <div key={index}>
            <CourseCard course={course} keyy={index} refreshList={refreshList} />
          </div>
        )
      })}
    </div>
  ) : (
    <div>No available courses</div>
  )
}