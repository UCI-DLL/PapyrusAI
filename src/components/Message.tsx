//reference: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/Message.js:0-4329

import React from "react";

interface MessageProps {
  message: string;
  displayName?: string;
}


export const MessageLeft = (props: MessageProps) => {
  const displayName = props.displayName ? props.displayName : "Displayname";
  return (
    <div className={"message__row-left"}>
      <div className={"message__left-display-name"}>{displayName}</div>
      <div className={"message__left-message"}>
        <p className={""}>{props.message}</p>
      </div>
    </div>
  );
};


export const MessageRight = (props: MessageProps) => {
  return (
    <div className={"message__row-right"}>
      <div className={"message__right-display-name"}>{"You"}</div>
      <div className={"message__right-message"}>
        <p className={""}>{props.message}</p>
      </div>
    </div>
  );
};
