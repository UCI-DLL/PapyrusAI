import React from "react";
import { useNavigate } from "react-router";
import { Button, Box, TextField, FormLabel } from "@mui/material";


export default function AddCourse(): JSX.Element {
  let navigator = useNavigate();


  function handleSubmit() {
    //TODO
  }


  return (
    <div className="courses">
      <div className="courses__section-header">
        <h3>Create Course</h3>
        <div>
          <Button variant="contained" onClick={() => navigator("/")}>Save</Button>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={() => navigator("/")} color="secondary">Cancel</Button>
        </div>
      </div>
      <hr />
      <Box className="courses__add">
        <form onSubmit={handleSubmit}>
          <FormLabel>Enter Course Information</FormLabel>
          <TextField
            name="coursename"
            label="Course Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
          // value={session.username}
          //   onChange={handleChange}
          //   error={usernameError !== ""}
          //   helperText={usernameError}
          //   disabled={isLoading}
          />
          <TextField
            name="coursename"
            label="Course Description"
            fullWidth
            sx={{ margin: ".5rem 0" }}
          />
          <TextField
            name="coursename"
            label="Course Sign Up Code"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            placeholder="123234"
          />
        </form>
      </Box>
    </div>
  )
}