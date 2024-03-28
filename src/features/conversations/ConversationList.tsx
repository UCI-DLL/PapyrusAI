import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, ListItem, ListItemText, Divider, List, Typography, TextField } from "@mui/material";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { getConversationList, postCreateConversation, postUpdateConversation } from "../../utility/endpoints/ConversationEndpoints";
import Post from "../../utility/Post";
import { ConversationListType } from "../../utility/types/ConversationTypes";
import { Link } from "react-router-dom";
import { CourseType } from "../../utility/types/CourseTypes";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import { UserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { Modal } from "../../components/Modal";
import { AlertContext } from "../../utility/context/AlertContext";

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
  const { user } = useContext(UserContext);
  const [conversationList, setConversationList] = useState<ConversationListType>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [course, setCourse] = useState<CourseType>();
  //This is for when instructors or admins are looking up a different student
  const [viewUser, setViewUser] = useState<UserType>();
  const { setAlert } = useContext(AlertContext);
  const [openRenameModal, setOpenRenameModal] = useState<{
    open: boolean,
    courseId: string,
    moduleId: string,
    index: number,
    name: string,
    error: string
  }>({
    open: false,
    courseId: "",
    moduleId: "",
    index: 0,
    name: "",
    error: ""
  });


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
      //instructors or admins can view other user's conversation lists
      var username;
      if (location.pathname.split("/")[6]) {
        username = location.pathname.split("/")[6];
      }
      setModuleIds({ courseId: courseId, moduleId: moduleId });
      setIsLoading(true);
      //get conversation list based on course and module
      Get(getConversationList(courseId, moduleId, username), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get conversation list for this course/module
            setConversationList(res.data);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            // handle error
            setError("No Conversations Found");
          }
        }
        setIsLoading(false);
      });

      Get(getCourse(courseId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get the course and save the modules
            setCourse(res.data);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            setError("Course Does Not Exist");
          }
        }
      });

      if (username) {
        //get user details
        Get(getUserData(username), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              setViewUser(res.data);
            }
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setError("Could not find user")
            }
          }
        });
      }
    }
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function handleNewConversation() {
    if (moduleIds) {
      Post(postCreateConversation(moduleIds?.courseId, moduleIds?.moduleId), {}).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //update conversation list with new conversation list
            setConversationList(res.data);
            //then go right into chat
            if (res.data.conversations) {
              navigator(`/chat/${user?.sub}/${moduleIds.courseId}/${moduleIds.moduleId}/${res.data.conversations.length - 1}`)
            }
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setAlert({ message: "Something went wrong. Try again later", type: "error" });
        }
        setIsLoading(false);
      });
    }
  }

  function handleConverstionNameUpdate(
    renameObject: {
      open: boolean,
      courseId: string,
      moduleId: string,
      index: number,
      name: string,
      error: string
    }
  ) {
    if (renameObject.name.length > 260) {
      setOpenRenameModal(prev => ({ ...prev, error: "Name is too long" }))
    } else if (renameObject.name.length === 0) {
      setOpenRenameModal(prev => ({ ...prev, error: "Name cannot be empty" }))
    } else {
      setIsLoading(true);
      Post(postUpdateConversation(
        renameObject.courseId,
        renameObject.moduleId,
        renameObject.index.toString()
      ), { name: renameObject.name }).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //update conversation list with new conversation list
            setConversationList(res.data);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setAlert({ message: "Something went wrong. Try again later", type: "error" });
        }
        //then close modal
        setOpenRenameModal({
          open: false,
          courseId: "",
          moduleId: "",
          index: 0,
          name: "",
          error: ""
        });
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
          <Modal
            isOpen={openRenameModal.open}
            onRequestClose={() => setOpenRenameModal({
              open: false,
              courseId: "",
              moduleId: "",
              index: 0,
              name: "",
              error: ""
            })}
            title="Rename Conversation"
            actions={
              <Button
                sx={{ width: "100%" }}
                variant="contained"
                onClick={() => handleConverstionNameUpdate(openRenameModal)}
              >
                Submit
              </Button>
            }
          >
            <div>
              <TextField
                name="name"
                label="Conversation Name"
                fullWidth
                sx={{ margin: ".5rem 0" }}
                value={openRenameModal.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  setOpenRenameModal(prev => ({ ...prev, name: e.target.value }))
                }}
                error={openRenameModal.error !== ""}
                helperText={openRenameModal.error}
                disabled={isLoading}
                required
              />
            </div>
          </Modal>
          <div className="courses__section-header">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "baseline" }}>
              {viewUser ? (
                <h3>{viewUser.name} {viewUser.family_name} Conversations</h3>
              ) : (
                <h3>My Conversations</h3>
              )}
              {course && (
                <>
                  <Typography sx={{ fontSize: 14 }} color="text.secondary">
                    {course.section ?
                      `${course.term ? course.term : ""}${course.year ? course.year : ""} - ${course.section}` :
                      `${course.term ? course.term : ""}${course.year ? course.year : ""}`}
                  </Typography>
                  <Typography variant="h5" component={"div"}>
                    {course.modules.find(x => x.id === moduleIds?.moduleId)?.name} - {course.name}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }} color="text.secondary" >
                    {`Instructor: ${course.instructor.name} ${course.instructor.family_name}`}
                  </Typography>
                </>
              )}
            </div>

            <div>
              {viewUser ? <></> : (
                <Button variant="contained" onClick={handleNewConversation}>New Conversation</Button>
              )}
            </div>
          </div>
          <hr />
          <List sx={style} aria-label="conversation list">
            {conversationList &&
              moduleIds &&
              user &&
              conversationList.conversations &&
              conversationList.conversations.length > 0 ?
              conversationList.conversations.sort((a: any, b: any) => (b.id > a.id) ? 1 : ((a.id > b.id) ? -1 : 0)).map((conversation, index) => {
                const time = new Date(parseInt(conversation.id.substring(0, 13), 10)).toLocaleString();
                const link = viewUser ?
                  `/chat/${viewUser.sub}/${moduleIds.courseId}/${moduleIds.moduleId}/${conversationList.conversations.length - index - 1}` :
                  `/chat/${user.sub}/${moduleIds.courseId}/${moduleIds.moduleId}/${conversationList.conversations.length - index - 1}`
                return (
                  <div key={index}>
                    <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                      {/* redirect to chat with and pass params  */}
                      <Link
                        to={link}
                        style={{ textAlign: "left", display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}
                      >
                        <ListItemText primary={`${conversation.name}`} secondary={`Created: ${time}`} />

                      </Link>
                      {viewUser ? (
                        <Button variant="contained" onClick={() => navigator(link)}>View</Button>
                      ) : (
                        <>
                          <Button onClick={() => {
                            setOpenRenameModal({
                              open: true,
                              courseId: moduleIds.courseId,
                              moduleId: moduleIds.moduleId,
                              index: conversationList.conversations.length - index - 1,
                              name: conversation.name,
                              error: ""
                            })
                          }}
                          >
                            Edit
                          </Button>
                          <Button variant="contained" onClick={() => navigator(link)}>Chat</Button>
                        </>
                      )}
                    </ListItem>
                    {index !== conversationList.conversations.length - 1 ? ( //only have dividers between modules
                      <Divider />
                    ) : <></>}
                  </div>
                )
              }) : (
                <div style={{ display: "flex", width: "100%", alignContent: "center", justifyContent: "center" }}>
                  {viewUser ? (
                    <div>No conversations yet</div>
                  ) : (
                    <Button variant="contained" onClick={handleNewConversation}>Start a Conversation</Button>
                  )}
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