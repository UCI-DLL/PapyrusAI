import React, { useContext, useEffect, useState } from "react";
import { CourseType } from "../../utility/types/CourseTypes";
import CourseCard from "../../components/CourseCard";
import { orderCourseRecentlyCreated } from "../../utility/Helpers";
import { UserContext } from "../../utility/context/UserContext";
import { postCreateUserFavoritingData, putUpdateUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import Post from "../../utility/Post";
import Put from "../../utility/Put";
import { useNavigate } from "react-router";
import { AlertContext } from "../../utility/context/AlertContext";

interface CourseListProps {
  list: Array<CourseType>;
  refreshList: () => void;
  starredList: Array<string>;
}

export default function CourseList({ list, refreshList, starredList }: CourseListProps): JSX.Element {
  const { user } = useContext(UserContext);
  let navigator = useNavigate();
  const [courses, setCourses] = useState<Array<CourseType>>(list);
  const [starred, setStarred] = useState<Array<CourseType>>([]);
  const { setAlert } = useContext(AlertContext);

  useEffect(() => {
    //move starred courses into its own list 
    //take out of main list
    updateStarredCourses(starredList)

    return () => {
      setCourses([]);
      setStarred([]);
    }
    // eslint-disable-next-line
  }, [list, starredList]);

  function updateStarredCourses(starredCourses: Array<string>) {
    setCourses([]);
    setStarred([]);
    if (starredCourses && starredCourses.length > 0) {
      console.log(starredCourses)
      list.forEach(course => {
        if (starredCourses.includes(course.id)) {
          setStarred(prev => [...prev, course])
        } else {
          setCourses(prev => [...prev, course])
        }
      })
    } else {
      setCourses(list)
    }
  }

  function createStarredCourse(courseId: string) {
    Post(postCreateUserFavoritingData(), { id: courseId, type: "course" }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.course) {
          //update course lists as needed
          console.log(res.data)
          updateStarredCourses(res.data.course)
          setAlert({ message: "Course added to favorites.", type: "info" })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" })
      }
    });
  }

  function removeStarredCourse(courseId: string) {
    Put(putUpdateUserFavoritingData(), { id: courseId, type: "course" }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.course) {
          //update course lists as needed
          console.log(res.data)
          updateStarredCourses(res.data.course)
          setAlert({ message: "Course removed from favorites.", type: "info" })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" })
      }
    });
  }

  return list.length > 0 ? (
    <div className="courses__list">
      {/*  pin starred courses to top of list */}
      {orderCourseRecentlyCreated(starred).map((course, index) => {
        return (
          <div key={index}>
            <CourseCard
              course={course}
              keyy={index}
              refreshList={refreshList}
              isStarred
              createStarredCourse={createStarredCourse}
              removeStarredCourse={removeStarredCourse}
            />
          </div>
        )
      })}
      {orderCourseRecentlyCreated(courses).map((course, index) => {
        return (
          <div key={index}>
            <CourseCard
              course={course}
              keyy={index}
              refreshList={refreshList}
              createStarredCourse={createStarredCourse}
              removeStarredCourse={removeStarredCourse}
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