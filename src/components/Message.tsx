//reference: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/Message.js:0-4329
//reference: https://edvins.io/react-text-to-speech

import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CustomTypingIndicator } from "./CustomTypingIndictor";
import { MessageTypeType } from "../utility/types/ConversationTypes";
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import StopIcon from '@mui/icons-material/Stop';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { Tooltip, SnackbarCloseReason, Snackbar, IconButton, Button } from "@mui/material";
import { Modal } from "./Modal";
import RaterEssay from "./RaterEssay";

interface MessageProps {
  message: string;
  displayName?: string;
  typing?: boolean;
  messageType?: MessageTypeType,
  outOfContext?: boolean,
  visible?: boolean, // visible to user?
  expandableMessage?: string, //message is clickable and shows extra text in modal
}

export const MessageLeft = (props: MessageProps) => {
  const displayName = props.displayName ? props.displayName : "Displayname";
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);
  const [open, setOpen] = React.useState(false); //open snackbar
  const [showExpandableMessage, setShowExpandableMessage] = useState<boolean>(false);
  const [expandableMessage] = useState(props.expandableMessage ? JSON.parse(props.expandableMessage) : undefined);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(props.message);
    setUtterance(u);
    return () => {
      synth.cancel();
    };
  }, [props.message]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    synth.speak(utterance);
    setIsPlaying(true)
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(false);
  };

  const handleClick = () => { //snackbar
    setOpen(true);
  };

  const handleClose = ( //snackbar
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (props.visible === undefined || props.visible) ? (
    <div
      className={"message__row-left"}
    >
      {props.expandableMessage && expandableMessage ? (
        <Modal
          isOpen={showExpandableMessage}
          title={"Essay Feedback"}
          onRequestClose={() => setShowExpandableMessage(false)}
          actions={
            <>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowExpandableMessage(false)}>
                Back to Conversation
              </Button>
            </>
          }
        >
          <RaterEssay message={expandableMessage.message} raterArray={expandableMessage.rater} essay={expandableMessage.essay} />
        </Modal>
      ) : <></>}
      <div className={"message__left-display-name"}>
        {displayName}
        &nbsp;
        <div className="message__left-controls" style={{ display: 'block' }}>
          {isPlaying ? (
            <Tooltip
              title="Stop"
            >
              <button onClick={handleStop}>
                <StopIcon />
              </button>
            </Tooltip>
          ) : (
            <Tooltip
              title="Play"
            >
              <button onClick={handlePlay}>
                <RecordVoiceOverIcon />
              </button>
            </Tooltip>
          )}
          &nbsp;&nbsp;
          <Tooltip
            title="Copy"
          >
            <button onClick={() => {
              handleClick()
              navigator.clipboard.writeText(props.message)
            }}>
              <ContentCopyIcon />
            </button>
          </Tooltip>
        </div>
      </div>
      {props.expandableMessage ? (
        <button
          onClick={() => setShowExpandableMessage(true)}
          className={props.outOfContext ? "message__left-message message__out-context" : "message__left-message"}
        >
          {props.typing ? (
            <CustomTypingIndicator />
          ) : (
            <Markdown remarkPlugins={[remarkGfm]} className={""}>{props.message}</Markdown>
          )}
        </button>
      ) : (
        <div className={props.outOfContext ? "message__left-message message__out-context" : "message__left-message"}>
          {props.typing ? (
            <CustomTypingIndicator />
          ) : (
            <Markdown remarkPlugins={[remarkGfm]} className={""}>{props.message}</Markdown>
          )}
        </div>
      )}

      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message="Message copied to clipboard"
        action={action}
      />
    </div>
  ) : (<></>);
};


export const MessageRight = (props: MessageProps) => {
  const [openFileModal, setOpenFileModal] = useState<boolean>(false);
  const [expandFile, setExpandFile] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);
  const [open, setOpen] = React.useState(false); //snackbar

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(props.message);
    setUtterance(u);
    return () => {
      synth.cancel();
    };
  }, [props.message]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    synth.speak(utterance);
    setIsPlaying(true)
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(false);
  };

  const handleClick = () => { //snackbar
    setOpen(true);
  };

  const handleClose = ( //snackbar
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (props.visible === undefined || props.visible) ? (
    <div
      className={"message__row-right"}
    >
      <div className={"message__right-display-name"}>
        {props.displayName ? props.displayName : "You"}
        &nbsp;
        <div className="message__right-controls" style={{ display: 'block' }}>
          {isPlaying ? (
            <Tooltip
              title="Stop"
            >
              <button onClick={handleStop}>
                <StopIcon />
              </button>
            </Tooltip>
          ) : (
            <Tooltip
              title="Play"
            >
              <button onClick={handlePlay}>
                <RecordVoiceOverIcon />
              </button>
            </Tooltip>
          )}
          &nbsp;&nbsp;
          <Tooltip
            title="Copy"
          >
            <button onClick={() => {
              handleClick()
              navigator.clipboard.writeText(props.message)
            }}>
              <ContentCopyIcon />
            </button>
          </Tooltip>
        </div>
      </div>
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
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message="Message copied to clipboard"
        action={action}
      />
    </div>
  ) : <></>;
};

