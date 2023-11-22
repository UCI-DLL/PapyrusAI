import React, { useContext } from "react";
import { useNavigate } from "react-router";
import { Button, Divider, List, ListItem, ListItemText } from "@mui/material";
import { CourseType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";

interface ModuleListProps {
  course: CourseType;
}

export default function ModuleList({ course }: ModuleListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };

  return course.modules.length > 0 ? (
    <div className="modules__list">
      <List sx={style} aria-label="modules list">
        {course.modules.map((module, index) => {
          return (
            <div key={index}>
              {/* button redirect to the conversation */}
              <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                <button onClick={() => navigator(`/courses/${course.id}/modules/${module.id}`)} style={{ textAlign: "left" }}>
                  <ListItemText primary={module.name} secondary={course.name + " - " + course.instructor.name + " " + course.instructor.family_name} />
                  <div>{module.moduleDescription}</div>
                </button>
                <div style={{ display: "flex" }}>
                  {course.id && user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") &&
                    user?.groups.includes(course.id) &&
                    course.instructor.sub === user.sub ? (
                    <Button onClick={() => navigator(`/courses/${course.id}/editmodule/${module.id}`)}>Edit</Button>
                  ) : <></>}
                  <Button variant="contained" onClick={() => navigator(`/courses/${course.id}/modules/${module.id}`)}>Begin Module</Button>
                </div>

              </ListItem>
              {index !== course.modules.length - 1 ? ( //only have dividers between modules
                <Divider />
              ) : <></>}
            </div>
          )
        })}
      </List>

    </div>
  ) : (
    <div>No available modules</div>
  )
}