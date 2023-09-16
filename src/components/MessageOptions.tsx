import { Button } from "@mui/material";
import React from "react";

interface MessageOptionsProps {
  message: string;
  options: Array<{title: string, message: string}>;
}

export default function MessageOptions(props: MessageOptionsProps) {
//TODO
  return (
    <div className="messageOptions">
      <hr />
      <div className="messageOptions__mainMessage">{props.message}</div>
      {
        props.options.map((option: {title: string, message: string}) => {
          return (
            <div className="messageOptions__options">
              <Button variant="outlined"   sx={{width: "100%", display: "flex", flexDirection: "column", textAlign: "left"}}>
                <div className="messageOptions__options__title">{option.title}</div>
                <div className="messageOptions__options__message">{option.message}</div>
              </Button>
            </div>
          )
        })
      }


      <hr/>
    </div>
  )
}