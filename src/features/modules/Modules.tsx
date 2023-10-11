import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@mui/material";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourse, getCourseList } from "../../utility/endpoints/CourseEndpoints";
import ModuleList from "./ModuleList";
import LinearProgress from '@mui/material/LinearProgress';


export default function Modules(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [moduleList, setModuleList] = useState<Array<ModuleType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  //This is only for a specific course
  const [course, setCourse] = useState<CourseType>();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    if (location.pathname === "/modules") { //show all modules
      Get(getCourseList(), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //update our version of user
            setModuleList(res.data.flatMap((course: { modules: ModuleType; }) => course.modules));
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setError("No Modules Found");
        }
        setIsLoading(false);
      });
    } else if (location.pathname.split("/")[1] === "courses") {
      const courseId = location.pathname.split("/")[2];
      Get(getCourse(courseId), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //update our version of user
            setModuleList(res.data.modules);
            setCourse(res.data);
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          //handle error
          setError("Course Does Not Exist");
        }
        setIsLoading(false);
      });
    }

    // eslint-disable-next-line
  }, []);

  return !isLoading ? (
    <div className="modules">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="modules__section-header">
            {course?.name ? (
              <>
                <h3>{course.name}'s Available Modules</h3>
                <Button
                  variant="contained"
                  onClick={() => navigator("/addmodule")}
                >
                  Create Module
                </Button>
              </>
            ) : (
              <h3>All Available Modules</h3>
            )}

          </div>
          <hr />
          {moduleList.length > 0 ? (
            <ModuleList list={moduleList} />
          ) : (
            <div>Course does not have any modules</div>
          )}
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}