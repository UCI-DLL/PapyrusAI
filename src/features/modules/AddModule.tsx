import React from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText
} from "@mui/material";


export default function AddModule(): JSX.Element {
  let navigator = useNavigate();


  function handleSubmit() {
    //TODO
  }


  return (
    <div className="modules">
      <div className="modules__section-header">
        <h3>Create Module</h3>
        <div>
          <Button variant="contained" onClick={() => navigator("/")}>Save</Button>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={() => navigator("/")} color="secondary">Cancel</Button>
        </div>
      </div>
      <hr />
      <Box className="modules__add">
        <form onSubmit={handleSubmit}>
          <TextField
            name="coursename"
            label="Module Name"
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
            label="Module Description"
            fullWidth
            sx={{ margin: ".5rem 0" }}
          />
          <TextField
            name="coursename"
            label="System Message"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            placeholder="123234"
          />
          <FormGroup>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="System Message Visible to Students"
            />
          </FormGroup>

          <hr />

          <FormGroup>
            <h4>Module Options</h4>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Overall Feedback"
            />
            <FormHelperText>This is the actual prompt that will be sent to ChatGPT.</FormHelperText>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Feedback on Thesis"
            />
            <FormHelperText>This is the actual prompt that will be sent to ChatGPT.</FormHelperText>

            <FormControlLabel
              control={<Checkbox />}
              label="Feedback on Tone"
            />
            <FormHelperText>This is the actual prompt that will be sent to ChatGPT.</FormHelperText>

          </FormGroup>

          <hr />

          <FormGroup>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Repeat Module Options"
            />
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Allow Open Text"
            />
            <FormHelperText>Allow students to write their own responses to ChatGPT</FormHelperText>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label="Visible"
            />
          </FormGroup>

        </form>
      </Box>
    </div>
  )
}