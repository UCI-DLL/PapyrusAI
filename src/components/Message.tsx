//reference: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/Message.js:0-4329

import React from "react";
import Markdown from "react-markdown";
import { CustomTypingIndicator } from "./CustomTypingIndictor";

interface MessageProps {
  message: string;
  displayName?: string;
  typing?: boolean;
}


export const MessageLeft = (props: MessageProps) => {
  const displayName = props.displayName ? props.displayName : "Displayname";
  return (
    <div className={"message__row-left"}>
      <div className={"message__left-display-name"}>{displayName}</div>
      <div className={"message__left-message"}>
        {props.typing ? (
          <CustomTypingIndicator />
        ) : (
          <Markdown className={""}>{props.message}</Markdown>
        )}
      </div>
    </div>
  );
};


export const MessageRight = (props: MessageProps) => {
  return (
    <div className={"message__row-right"}>
      <div className={"message__right-display-name"}>{"You"}</div>
      <div className={"message__right-message"}>
        <Markdown className={""}>{props.message}</Markdown>
      </div>
    </div>
  );
};
