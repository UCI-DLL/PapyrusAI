import React, { useEffect, useState, useContext } from "react";
import CourseList from "../course-groups/CourseList";
import ModuleList from "../modules/ModuleList";
import { Button } from "@mui/material";
import { useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import { CourseType } from "../../utility/types/CourseTypes";
import LinearProgress from '@mui/material/LinearProgress';
import { UserContext } from "../../utility/context/UserContext";


export default function Dashboard(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    Get(getCourseList(), controller.signal).then(res => {
      if (res.status && res.status < 300) {
        if (res.data) {
          //update our version of user
          setCourseList(res.data);
        }
      } else if (res.status === 401) {
        navigator("/login");
      } else {
        // handle error
        setCourseList([])
      }
      setIsLoading(false);
    });
    // eslint-disable-next-line
  }, []);

  return !isLoading ? (
    <div className="dashboard">
      <div className="dashboard__section-header">
        <h3>My Courses</h3>
        {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
          <Button variant="contained" onClick={() => navigator("/createcourse")}>Create Course</Button>
        )}
      </div>

      <hr />
      <CourseList list={courseList} />

      &nbsp;&nbsp;&nbsp;

      <div className="dashboard__section-header">
        <h3>Available Modules</h3>
        {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
          <Button variant="contained" onClick={() => navigator("/createmodule")}>Create Module</Button>
        )}
      </div>
      <hr />
      <ModuleList list={courseList.flatMap(course => course.modules)} />

    </div>
  ) : (
    <LinearProgress />
  )
}