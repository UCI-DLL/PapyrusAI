import React from "react";
import CourseList from "../course-groups/CourseList";
import AssignmentList from "../assignment-modules/AssignmentList";
import { Button } from "@mui/material";


export default function Dashboard(): JSX.Element {

  return (
    <div style={{
      maxWidth: "1024px",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      flexDirection: "column",
      margin: "0 auto",
      padding: "0.4rem",
      width: "100%",
    }}>
      <div style={{ display: "flex", flexDirection:"row", justifyContent: "space-between", width: "100%"}}>
        <h3>My Courses</h3>
        <Button variant="contained">Create Class</Button>
      </div>

      <hr />
      <div>
        <CourseList />
      </div>

      &nbsp;&nbsp;&nbsp;

      <div style={{ display: "flex", flexDirection:"row", justifyContent: "space-between", width: "100%"}}>
        <h3>Available Modules</h3>
        <Button variant="contained">Create Module</Button>
      </div>
      <hr />
      <div style={{width: "100%"}}>
        <AssignmentList />
      </div>
      
    </div>
  )
}