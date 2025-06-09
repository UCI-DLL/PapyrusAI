import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, Typography } from "@mui/material";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import ModuleList from "./ModuleList";
import LinearProgress from '@mui/material/LinearProgress';
import { UserContext } from "../../utility/context/UserContext";


export default function Modules(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [course, setCourse] = useState<CourseType>();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    if (location.pathname.split("/")[1] === "courses" && location.pathname.split("/")[2]) {
      const courseId = location.pathname.split("/")[2];
      getThisCourse(courseId, controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location]);

  function getThisCourse(courseId: string, signal: AbortSignal) {
    Get(getCourse(courseId), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //Get the course and save the modules
          setCourse(res.data);
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          //handle error
          setError("Course Does Not Exist");
          setIsLoading(false);
        }
      }
    });
  }

  function refreshList() {
    const controller = new AbortController();
    getThisCourse(location.pathname.split("/")[2], controller.signal)
  }

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
                {((user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") &&
                  course.instructor.username === user.username) ||
                  user?.groups.includes(course.id + "-TA") //handle tas
                ) && (
                    <Button variant="contained" onClick={() => navigator(`/courses/${course.id}/createmodule`)}>Create Module</Button>
                  )}
              </>
            ) : (
              <h3>Available Modules</h3>
            )}

          </div>
          {course ? (
            <>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {course.section ?
                  `${course.term ? course.term : ""}${course.year ? course.year : ""} - ${course.section}` :
                  `${course.term ? course.term : ""}${course.year ? course.year : ""}`}
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {`Instructor: ${course.instructor.name} ${course.instructor.family_name}`}
              </Typography>
            </>
          ) : null}
          <span>
            Modules provide users access to conversations with the AI.
            {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ?
              " Modules can be customized to allow or restrict access to specific conversation prompts (AI instructions)." :
              ""}
            {course && course.modules.length > 0 ? (
              <span> To access a module, click the “Begin Module” button for the desired module.
                {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ?
                  <span>
                    &nbsp;For information on creating, editing, copying, or viewing activity for a module, please see the <a
                      href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.1lkc6zx0k17t"
                      target="_blank" rel="noreferrer">“Modules” section of our instructor guide
                    </a>.
                  </span> :
                  ""}
              </span>
            ) : ""}
          </span>
          <hr />
          {course ? (
            <ModuleList course={course} refreshList={refreshList} />
          ) : (
            <div>No modules in this course are currently available to you.
              {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ?
                " To create a module, go to the course in which you would like to create the module." :
                ""}
            </div>
          )}
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}