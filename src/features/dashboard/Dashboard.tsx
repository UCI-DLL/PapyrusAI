import React from "react";
import CourseList from "../course-groups/CourseList";
import AssignmentList from "../assignment-modules/AssignmentList";
import { Button } from "@mui/material";
import { useNavigate } from "react-router";


export default function Dashboard(): JSX.Element {
  let navigator = useNavigate();

  return (
    <div className="dashboard">
      <div className="dashboard__section-header">
        <h3>My Courses</h3>
        <Button variant="contained" onClick={() => navigator("/createcourse")}>Create Course</Button>
      </div>

      <hr />
      <CourseList />

      &nbsp;&nbsp;&nbsp;

      <div className="dashboard__section-header">
        <h3>Available Modules</h3>
        <Button variant="contained" onClick={() => navigator("/addassignment")}>Create Module</Button>
      </div>
      <hr />
      <AssignmentList />

    </div>
  )
}