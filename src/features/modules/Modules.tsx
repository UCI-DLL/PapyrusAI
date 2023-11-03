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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [course, setCourse] = useState<CourseType>();

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    if (location.pathname.split("/")[1] === "courses" && location.pathname.split("/")[2]) {
      const courseId = location.pathname.split("/")[2];
      Get(getCourse(courseId), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //Get the course and save the modules
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
  }, [location]);

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
                {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
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
          <hr />
          {course ? (
            <ModuleList course={course} />
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