import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import ModuleList from "./ModuleList";
import LinearProgress from '@mui/material/LinearProgress';


export default function AllModules(): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [courseList, setCourseList] = useState<Array<CourseType>>([])

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    //show all modules
    getCourses(controller.signal);

    return () => {
      controller.abort();
    };

    // eslint-disable-next-line
  }, []);

  function getCourses(signal: AbortSignal) {
    setIsLoading(true);
    Get(getCourseList(), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          // Use next line if you want the list of all modules but dont care about the course id or name
          // setModuleList(res.data.flatMap((course: { modules: ModuleType; }) => course.modules));
          //Get the list of all courses for this user
          setCourseList(res.data);
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setError("No Modules Found");
          setIsLoading(false);
        }
      }
    });
  }

  function refreshList() {
    const controller = new AbortController();
    getCourses(controller.signal)
  }

  return !isLoading ? (
    <div className="modules">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          {courseList.length > 0 ? (
            <>
              <div className="modules__section-header">
                <h3>All Available Modules</h3>
              </div>
              <hr />
              {courseList.map((course, index) => {
                return course.modules.length > 0 ? (
                  <div key={index} style={{ width: "100%" }}>
                    <h4>{course.name}</h4>
                    <ModuleList course={course} refreshList={refreshList} />
                  </div>
                ) : (<div key={index}></div>)
              })}
            </>
          ) : (
            <div>No modules found</div>
          )}
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}