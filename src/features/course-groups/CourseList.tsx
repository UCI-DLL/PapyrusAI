import React from "react";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { CardHeader, IconButton } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CourseType } from "../../utility/types/CourseTypes";
import { useNavigate } from "react-router";

interface CourseListProps {
  list: Array<CourseType>
}

export default function CourseList({ list }: CourseListProps): JSX.Element {
  let navigator = useNavigate();
  return (
    <div className="courses__list">
      {list.map((course, index) => {
        return (
          <Card sx={{ width: 275, margin: "1rem" }} key={index}>
            <CardHeader
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              title={course.name}
              subheader={`Instructor: ${course.instructor.name} ${course.instructor.familyName}`}
            />
            <CardActions>
              <Button
                size="small"
                onClick={() => navigator(`/courses/${course.id}/modules`)}
              >
                View Modules
              </Button>
            </CardActions>
          </Card>
        )
      })}
    </div>
  )
}