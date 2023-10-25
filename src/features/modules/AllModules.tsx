import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import ModuleList from "./ModuleList";
import LinearProgress from '@mui/material/LinearProgress';


export default function AllModules(): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [courseList, setCourseList] = useState<Array<CourseType>>([])

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    //show all modules
    Get(getCourseList(), controller.signal).then(res => {
      if (res.status && res.status < 300) {
        if (res.data) {
          // Use next line if you want the list of all modules but dont care about the course id or name
          // setModuleList(res.data.flatMap((course: { modules: ModuleType; }) => course.modules));
          //Get the list of all courses for this user
          setCourseList(res.data);
        }
      } else if (res.status === 401) {
        navigator("/login");
      } else {
        // handle error
        setError("No Modules Found");
      }
      setIsLoading(false);
    });

    // eslint-disable-next-line
  }, []);

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
                    <ModuleList course={course} />
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