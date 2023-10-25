import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, ListItem, ListItemText, Divider, List } from "@mui/material";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { getConversationList, postCreateConversation } from "../../utility/endpoints/ConversationEndpoints";
import Post from "../../utility/Post";
import { ConversationListType } from "../../utility/types/ConversationTypes";
import { Link } from "react-router-dom";
import { CourseType } from "../../utility/types/CourseTypes";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";

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
  const [course, setCourse] = useState<CourseType>();


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

      Get(getCourse(courseId), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //Get the course and save the modules
            setCourse(res.data);
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          //handle error
          setError("Course Does Not Exist");
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
            //then go right into chat
            if(res.data.conversations) {
              navigator("/chat", {state: { ...moduleIds, conversationIndex: res.data.conversations.length - 1 }})
            }
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

  return !isLoading && course ? (
    <div className="courses">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="courses__section-header">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "baseline" }}>
              <h3>My Conversations</h3>
              {course && (
                <h5>{course.modules.find(x => x.id === moduleIds?.moduleId)?.name} - {course.name}</h5>
              )}
            </div>

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
                      <Link
                        to={"/chat"}
                        state={{ ...moduleIds, conversationIndex: index }}
                        style={{ textAlign: "left", display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}
                      >
                        <ListItemText primary={`Conversation ${index + 1}`} secondary={`Created: ${time}`} />
                        <Button variant="contained">Chat</Button>
                      </Link>
                    </ListItem>
                    {index !== conversationList.conversations.length - 1 ? ( //only have dividers between modules
                      <Divider />
                    ) : <></>}
                  </div>
                )
              }) : (
                <div style={{ display: "flex", width: "100%", alignContent: "center", justifyContent: "center" }}>
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