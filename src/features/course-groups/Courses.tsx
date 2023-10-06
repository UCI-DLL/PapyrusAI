import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@mui/material";
import CourseList from "./CourseList";


export default function Courses(): JSX.Element {
  let navigator = useNavigate();



  return (
    <div className="courses">

      <div className="courses__section-header">
        <h3>My Courses</h3>
        <Button variant="contained" onClick={() => navigator("/createcourse")}>Create Course</Button>
      </div>
      <hr />
      <CourseList />

    </div>
  )
}