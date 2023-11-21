//reference: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/Message.js:0-4329

import React, { useState } from "react";
import Markdown from "react-markdown";
import { CustomTypingIndicator } from "./CustomTypingIndictor";
import { MessageTypeType } from "../utility/types/ConversationTypes";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Tooltip } from "@mui/material";
import { Modal } from "./Modal";

interface MessageProps {
  message: string;
  displayName?: string;
  typing?: boolean;
  messageType?: MessageTypeType,
  outOfContext?: boolean,
}


export const MessageLeft = (props: MessageProps) => {
  const displayName = props.displayName ? props.displayName : "Displayname";
  return (
    <div className={"message__row-left"}>
      <div className={"message__left-display-name"}>{displayName}</div>
      <div className={props.outOfContext ? "message__left-message message__out-context" : "message__left-message"}>
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
  const [openFileModal, setOpenFileModal] = useState<boolean>(false);
  const [expandFile, setExpandFile] = useState<boolean>(false);
  return (
    <div className={"message__row-right"}>
      <div className={"message__right-display-name"}>{props.displayName ? props.displayName : "You"}</div> 
      {props.messageType && props.messageType === "file" ? (
        <div className={props.outOfContext ? "message__right-message message__out-context" : "message__right-message"}>
          <Modal
            isOpen={openFileModal}
            onRequestClose={() => setOpenFileModal(false)}
          >
            <div>{props.message}</div>
          </Modal>
          <div className="message__file">
            <div>{expandFile ? props.message : props.message.substring(0, 200) + "..."}</div>
            <hr />
            <div style={{ display: "flex" }}>
              <button
                onClick={() => setExpandFile(!expandFile)}
              >
                {expandFile ? (
                  <>
                    <ExpandLessIcon />
                    Collapse
                  </>
                ) : (
                  <>
                    <ExpandMoreIcon />
                    Expand
                  </>
                )}
              </button>
              &nbsp;&nbsp;&nbsp;
              <button onClick={() => setOpenFileModal(!openFileModal)}>
                <Tooltip title={"Fullscreen"}>
                  <OpenInFullIcon fontSize="small" />
                </Tooltip>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={props.outOfContext ? "message__right-message message__out-context" : "message__right-message"}>
          <Markdown className={""}>{props.message}</Markdown>
        </div>
      )}
    </div>
  );
};

