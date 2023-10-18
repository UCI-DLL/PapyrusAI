import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, ListItem, ListItemText, Divider, List } from "@mui/material";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { getConversationList, postCreateConversation } from "../../utility/endpoints/ConversationEndpoints";
import Post from "../../utility/Post";
import { ConversationListType } from "../../utility/types/ConversationTypes";
import { Link } from "react-router-dom";

export default function ConversationList(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };
  const [moduleIds, setModuleIds] = useState<{
    courseId: string,
    moduleId: string
  }>();
  const [conversationList, setConversationList] = useState<ConversationListType>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[4]
    ) {
      //get prev course data
      const courseId = location.pathname.split("/")[2];
      const moduleId = location.pathname.split("/")[4];
      setModuleIds({ courseId: courseId, moduleId: moduleId });
      setIsLoading(true);
      //get conversation list based on course and module
      Get(getConversationList(courseId, moduleId), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //Get conversation list for this course/module
            setConversationList(res.data);
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setError("No Conversations Found");
        }
        setIsLoading(false);
      });
    }
    // eslint-disable-next-line
  }, []);

  function handleNewConveration() {
    if (moduleIds) {
      Post(postCreateConversation(moduleIds?.courseId, moduleIds?.moduleId), {}).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //update conversation list with new conversation list
            setConversationList(res.data);
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          // handle error
        }
        setIsLoading(false);
      });
    }
  }

  return !isLoading ? (
    <div className="courses">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="courses__section-header">
            <h3>My Conversations</h3>
            <div>
              <Button variant="contained" onClick={handleNewConveration}>New Conversation</Button>
            </div>
          </div>
          <hr />
          <List sx={style} aria-label="conversation list">
            {conversationList && 
            conversationList.conversations && 
            conversationList.conversations.length > 0 ?
            conversationList.conversations.map((conversation, index) => {
              const time = new Date(parseInt(conversation.id.substring(0, 13), 10)).toLocaleString();
              return (
                <div key={index}>
                  <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                    {/* redirect to chat with and pass params  */}
                    <Link to={"/chat"} state={{...moduleIds, conversationIndex: index }} style={{ textAlign: "left" }}>
                      <ListItemText primary={`Conversation ${index + 1}`} secondary={`Created: ${time}`} />
                    </Link>
                  </ListItem>
                  {index !== conversationList.conversations.length - 1 ? ( //only have dividers between modules
                    <Divider />
                  ) : <></>}
                </div>
              )
            }) : (
              <div style={{display: "flex", width: "100%", alignContent: "center", justifyContent: "center"}}>
                <Button variant="contained" onClick={handleNewConveration}>Start a Conversation</Button>
              </div>
            )}
          </List>
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}