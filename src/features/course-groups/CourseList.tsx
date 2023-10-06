import React from "react";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import { CardHeader, IconButton } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';


export default function CourseList(): JSX.Element {


  return (
    <div className="courses__list">
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