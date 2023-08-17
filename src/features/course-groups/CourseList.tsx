import React from "react";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { CardHeader, IconButton } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';


export default function CourseList(): JSX.Element {



  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* <Card sx={{ width: 275, margin: "1rem" }}>
        <CardContent>
          <Typography variant="h5">Create a Class</Typography>
        </CardContent>
        <CardActions>
          <button style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <AddCircleOutlineIcon fontSize="large" />
          </button>

        </CardActions>
      </Card> */}

      <Card sx={{ width: 275, margin: "1rem" }}>
        <CardHeader
          action={
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          }
          title="ENG 123"
          subheader="1 Module(s) Available"
        />
        <CardActions>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>

      <Card sx={{ width: 275, margin: "1rem" }}>
        <CardHeader
          action={
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          }
          title="ENG 124"
          subheader="2 Module(s) Available"
        />
        <CardActions>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>

      <Card sx={{ width: 275, margin: "1rem" }}>
        <CardHeader
          action={
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          }
          title="ENG 125"
          subheader="3 Module(s) Available"
        />
        <CardActions>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>

      <Card sx={{ width: 275, margin: "1rem" }}>
        <CardHeader
          action={
            <IconButton aria-label="settings">
              <MoreVertIcon />
            </IconButton>
          }
          title="ENG 127"
          subheader="6 Module(s) Available"
        />
        <CardActions>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>
    </div>
  )
}