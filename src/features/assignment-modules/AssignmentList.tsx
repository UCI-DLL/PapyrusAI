import React from "react";
import { useNavigate } from "react-router";
import { Divider, List, ListItem, ListItemText } from "@mui/material";


export default function AssignmentList(): JSX.Element {
  let navigator = useNavigate();
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };


  return (
    <div className="assignments__list">

      <List sx={style} aria-label="assignment list">
        <button onClick={() => navigator("/module")}>
          <ListItem >
            <ListItemText primary="ENG 123 Module 1" secondary="Due: 1/1/24" />
          </ListItem>
        </button>
        <Divider />
        <button onClick={() => navigator("/module")}>
          <ListItem onClick={() => navigator("/module")}>
            <ListItemText primary="ENG 123 Module 2" secondary="Due: 1/1/24" />
          </ListItem>
        </button>
        <Divider />
        <button onClick={() => navigator("/module")}>
          <ListItem onClick={() => navigator("/module")}>
            <ListItemText primary="ENG 125 Module 1" secondary="Due: 1/1/24" />
          </ListItem>
        </button>
        <Divider />
        <button onClick={() => navigator("/module")}>
          <ListItem onClick={() => navigator("/module")}>
            <ListItemText primary="ENG 126 Module 1" secondary="Due: 1/1/24" />
          </ListItem>
        </button>
      </List>

    </div>
  )
}