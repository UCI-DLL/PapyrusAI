import React, { useContext } from "react";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { CardContent, Typography } from "@mui/material";
import { CourseType } from "../../utility/types/CourseTypes";
import { useNavigate } from "react-router";
import { UserContext } from "../../utility/context/UserContext";
import { CustomUserType } from "../../utility/types/UserTypes";

interface CourseListProps {
  list: Array<CourseType>
}

export default function CourseList({ list }: CourseListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);

  return list.length > 0 ? (
    <div className="courses__list">
      {list.map((course, index) => {
        return (
          <div key={index}>
            <Card sx={{ width: 275, margin: "1rem" }}>
              <CardContent>
                <Typography sx={{ fontSize: 14 }} color="text.secondary">
                  {course.section ?
                    `${course.term ? course.term : ""}${course.year ? course.year : ""} - ${course.section}` :
                    `${course.term ? course.term : ""}${course.year ? course.year : ""}`}
                </Typography>
                <Typography variant="h5" component={"div"}>
                  {course.name}
                </Typography>
                <Typography sx={{ fontSize: 14 }} color="text.secondary" >
                  {`Instructor: ${course.instructor.name} ${course.instructor.family_name}`}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: "space-between" }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigator(`/courses/${course.id}/modules`)}
                >
                  {(
                    user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
                    user?.groups.includes(course.id + "-TA") //handle tas
                  ) &&
                    user?.groups.includes(course.id) &&
                    (course.instructor.sub === user.sub || (
                      course.taList &&
                      course.taList.find((a: CustomUserType) => a.sub === user?.sub) //handle tas too
                    )) ? "View / Edit Modules" : "View Modules"}
                </Button>
                {/* If use is instructor and is in the course  */}
                {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") &&
                  user?.groups.includes(course.id) &&
                  course.instructor.sub === user.sub ? (
                  <Button
                    size="small"
                    onClick={() => navigator(`/editcourse/${course.id}`)}
                  >
                    Edit Course
                  </Button>
                ) : <></>}
              </CardActions>
            </Card>

          </div>
        )
      })}
    </div>
  ) : (
    <div>No available courses</div>
  )
}