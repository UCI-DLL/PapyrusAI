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
import { Tooltip, SnackbarCloseReason, Snackbar, IconButton, Button, CardContent, Typography, CardActions, Link, Box } from "@mui/material";
import { Modal } from "./Modal";
import RaterEssay from "./RaterEssay";
import { truncateString } from "../utility/Helpers";

interface MessageProps {
  message: string;
  displayName?: string;
  typing?: boolean;
  messageType?: MessageTypeType,
  outOfContext?: boolean,
  visible?: boolean, // visible to user?
  expandableMessage?: string, //message is clickable and shows extra text in modal
  isInstructor?: boolean, //show the message if not user visible and is an instructor
  sources?: Array<any> //web access sources
}

interface ViewSourcesProps {
  sources: Array<{ url: string, title: string, summary: string }>; // An array of Source objects
}

const ViewSources: React.FC<ViewSourcesProps> = ({ sources }) => {
  return (
    <div >
      {sources.map((source: { url: string, title: string, summary: string }, index: number) => { // Use the Source interface for type safety
        return (
          <Box component="span"
            sx={{
              display: 'inline-block',
              transform: 'scale(0.8)',
              width: '75%',
              backgroundColor: '#fafafa',
              border: '1px solid #f7f7f7',
              borderRadius: "0.4rem",
              color: "#222"
            }}
          >
            <CardContent>
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                Source {index + 1} {/* Start numbering from 1 for user-friendliness */}
              </Typography>
              <Typography variant="h6" component="div">
                {truncateString(source.title, 50)}
              </Typography>
              <Typography variant="body2">
                {truncateString(source.summary, 200)}
              </Typography>
            </CardContent>
            <CardActions sx={{ marginLeft: "0.4rem" }}>
              <Link href={source.url} underline="hover" target="_blank" rel="noopener" color="inherit">Visit</Link>
            </CardActions>
          </Box>
        );
      })}
    </div>
  );
};

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

  //if empty message
  if ((props.message === "" || props.message === null) && !props.typing) {
    return <></>;
  }

  return (props.visible === undefined || props.visible || props.isInstructor) ? (
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
        {props.isInstructor && !props.visible ? "Hidden Message - " : ""}
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
        <Button
          onClick={() => setShowExpandableMessage(true)}
          className={(props.outOfContext || (!props.visible && props.isInstructor)) ? "message__left-message message__out-context" : "message__left-message"}
          variant="outlined"
        >
          {props.typing ? (
            <CustomTypingIndicator />
          ) : (
            <Markdown remarkPlugins={[remarkGfm]} className={""}>{props.message}</Markdown>
          )}
        </Button>
      ) : (
        <div className={(props.outOfContext || (!props.visible && props.isInstructor)) ? "message__left-message message__out-context" : "message__left-message"}>
          {props.typing ? (
            <CustomTypingIndicator />
          ) : (
            <Markdown remarkPlugins={[remarkGfm]} className={""}>{props.message}</Markdown>
          )}
        </div>
      )}
      {props.sources && (
        <ViewSources sources={props.sources} />
      )}

      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message="Message copied to clipboard"
        action={action}
      />
    </div>
  ) : props.sources ? (
    <div>
      <ViewSources sources={props.sources} />
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

  function LinkRenderer(props: any) {
    return (
      <a href={props.href} target="_blank" rel="noreferrer">
        {props.children}
      </a>
    );
  }

  return (props.visible === undefined || props.visible || props.isInstructor) ? (
    <div
      className={"message__row-right"}
    >
      <div className={"message__right-display-name"}>
        {props.isInstructor && !props.visible ? "Hidden Message - " : ""}
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
        <div className={(props.outOfContext || (!props.visible && props.isInstructor)) ? "message__right-message message__out-context" : "message__right-message"}>
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
        <div className={(props.outOfContext || (!props.visible && props.isInstructor)) ? "message__right-message message__out-context" : "message__right-message"}>
          <Markdown className={""} components={{ a: LinkRenderer }}>{props.message}</Markdown>
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

