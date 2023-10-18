import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getUserConversationList } from "../../utility/endpoints/ConversationEndpoints";
import { ConversationType } from "../../utility/types/ConversationTypes";
import { CourseType } from "../../utility/types/CourseTypes";
import { UserType } from "../../utility/types/UserTypes";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import LinearProgress from '@mui/material/LinearProgress';


export default function UserReports(): JSX.Element {
  let navigator = useNavigate();
  let location = useLocation();
  const [conversationList, setConversationList] = useState<Array<{
    conversations: Array<ConversationType>,
    course: CourseType,
    courseId: string,
    moduleId: string
  }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    const controller = new AbortController();
    if (
      location.state &&
      location.pathname.split("/")[1] === "reports" &&
      location.pathname.split("/")[2]
    ) {
      //Get user information
      const username = location.pathname.split("/")[2];
      setUser(location.state);

      //get list of conversation
      Get(getUserConversationList(username), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //Get the list of all conversations
            //for each courseid, get the course data
            res.data.map((conversation: any) => {
              Get(getCourse(conversation.courseId), controller.signal).then(res1 => {
                if (res1.status && res1.status < 300) {
                  if (res1.data) {
                    //set conversation data
                    setConversationList((prev) => [...prev, {
                      conversations: conversation.conversations,
                      course: res1.data,
                      courseId: conversation.courseId,
                      moduleId: conversation.moduleId
                    }]);
                  }
                } else if (res1.status === 401) {
                  navigator("/login");
                } else {
                  //handle errors
                }
              })
              return ""
            })
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          // handle error
        }
        setIsLoading(false);
      });
    }

    return (() => {
      setConversationList([]);
    })
    // eslint-disable-next-line
  }, [location]);

  return !isLoading ? (
    <div className="reports">
      <h3>{`Reports ${user ? `for ${user.name} ${user.family_name}` : ""}`}</h3>
      <hr />

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Course</TableCell>
              <TableCell align="right">Module</TableCell>
              <TableCell align="right"># of Conversations</TableCell>
              <TableCell align="right">Last Accessed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conversationList.length > 0 && conversationList.map((row, index) => {
              //Get the time of last accessed
              var tempTime = row.conversations && row.conversations.length > 0 ? (row.conversations.reduce((x, y) => (
                x.messages.length > 0 && y.messages.length > 0 &&
                  x.messages
                    .reduce((largest, current) => (parseInt(current) > parseInt(largest) ? current : largest), row.conversations[0].messages[0]) >
                  y.messages
                    .reduce((largest, current) => (parseInt(current) > parseInt(largest) ? current : largest), row.conversations[0].messages[0]) ? x : y
              ), row.conversations[0])
                .messages
                .reduce((largest, current) => (parseInt(current) > parseInt(largest) ? current : largest), row.conversations[0].messages[0]))
                : "";
              if (tempTime) {
                tempTime = new Date(parseInt(tempTime.substring(0, 13), 10)).toLocaleString();
              } else {
                tempTime = "N/A"
              }
              return (
                <TableRow
                  key={index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.course.name}
                  </TableCell>
                  <TableCell align="right">{row.course.modules.find(x => x.id === row.moduleId)?.name}</TableCell>
                  <TableCell align="right">{row.conversations.length}</TableCell>
                  <TableCell align="right">{tempTime}</TableCell>
                </TableRow>
              )
            }
            )}
          </TableBody>
        </Table>
      </TableContainer>

    </div>
  ) : (
    <LinearProgress />
  )
}