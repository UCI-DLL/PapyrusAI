import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@mui/material";
import AssignmentList from "./AssignmentList";


export default function Assignments(): JSX.Element {
  let navigator = useNavigate();



  return (
    <div className="assignments">

      <div className="assignments__section-header">
        <h3>Available Modules</h3>
        <Button variant="contained" onClick={() => navigator("/addassignment")}>Create Module</Button>
      </div>
      <hr />
      <AssignmentList />

    </div>
  )
}