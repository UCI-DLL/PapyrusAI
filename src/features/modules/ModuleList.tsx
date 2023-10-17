import React, { useContext } from "react";
import { useNavigate } from "react-router";
import { Button, Divider, List, ListItem, ListItemText } from "@mui/material";
import { ModuleType } from "../../utility/types/CourseTypes";
import { UserContext } from "../../utility/context/UserContext";

interface ModuleListProps {
  list: Array<ModuleType>,
  courseId?: string
}

export default function ModuleList({ list, courseId }: ModuleListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };

  return list.length > 0 ? (
    <div className="modules__list">
      <List sx={style} aria-label="modules list">
        {list.map((module, index) => {
          return (
            <div key={index}>
              {/* button redirect to the conversation */}
              <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                <button onClick={() => courseId ? navigator(`/courses/${courseId}/modules/${module.id}`) : {}} style={{ textAlign: "left" }}>
                  <ListItemText primary={module.name} secondary={module.moduleDescription} />
                </button>
                {courseId && user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") &&
                  user?.groups.includes(courseId) ? (
                  <Button onClick={() => navigator(`/courses/${courseId}/editmodule/${module.id}`)}>Edit</Button>
                ) : <></>}
              </ListItem>
              {index !== list.length - 1 ? ( //only have dividers between modules
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