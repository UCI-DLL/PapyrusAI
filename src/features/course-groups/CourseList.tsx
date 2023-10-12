import React, { useContext } from "react";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { CardHeader } from "@mui/material";
import { CourseType } from "../../utility/types/CourseTypes";
import { useNavigate } from "react-router";
import { UserContext } from "../../utility/context/UserContext";

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
              <CardHeader
                title={course.name}
                subheader={`Instructor: ${course.instructor.name} ${course.instructor.familyName}`}
              />
              <CardActions sx={{ justifyContent: "space-between" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigator(`/courses/${course.id}/modules`)}
                >
                  View Modules
                </Button>
                {/* If use is instructor and is in the course  */}
                {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") &&
                  user?.groups.includes(course.id) ? (
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