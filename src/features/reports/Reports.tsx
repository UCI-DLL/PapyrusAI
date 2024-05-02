import {
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import { getAllCourseList, getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import LinearProgress from '@mui/material/LinearProgress';
import { CourseType } from "../../utility/types/CourseTypes";
import { Link } from "react-router-dom";
import { CustomUserType } from "../../utility/types/UserTypes";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type ReportsUserType = {
  email: string,
  family_name: string,
  name: string,
  sub: string,
}

export default function Reports(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [userList, setUserList] = useState<Array<{ users: Array<ReportsUserType>, course: CourseType }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };

  useEffect(() => {
    const controller = new AbortController();
    // for each course that the cuurent user is in, get the list of users
    if (user) {
      setIsLoading(true);
      // if user.groups includes admin permissions, then list ALL courses
      if (user && user.groups && user.groups.find(a => a.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin"))) {
        getAllCourses("", controller.signal);
      } else {
        user.groups.forEach((group) => {
          //skip instructor or student or admin groups
          //remove TAs also
          if (
            group === (process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
            group === (process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
            group.includes("-TA")
          ) {
            return ""
          }
          Get(getCourse(group), controller.signal).then(res1 => {
            if (res1 && res1.status && res1.status < 300) {
              if (
                res1.data &&
                res1.data.instructor &&
                (res1.data.instructor.sub === user.sub || (
                  res1.data.taList &&
                  res1.data.taList.find((a: CustomUserType) => a.sub === user.sub) //handle tas too
                ))
              ) { //only get the rest of the information if current user is instructor
                Get(getUsersInCourse(group), controller.signal).then(res => {
                  if (res && res.status && res.status < 300) {
                    if (res.data) {
                      //Get the list of all users in the group
                      setUserList((prev) => {
                        if (prev.find(x => x.course.id === res1.data.id)) {
                          //if the course has already been added, skip
                          //this is a react strict mode work around so we dont get doubles
                          return prev
                        } else {
                          return [...prev, { users: res.data, course: res1.data }];
                        }
                      });
                    }
                  } else if (res && res.status === 401) {
                    navigator("/login");
                  } else {
                    // handle error
                    // setError("No courses Found");
                  }
                });
              }
            } else if (res1 && res1.status === 401) {
              navigator("/login");
            } else {
              //handle errors
            }
          })
        })
      }

      setIsLoading(false);
    }

    return (() => {
      setUserList([]);
      controller.abort();
    });

    // eslint-disable-next-line
  }, []);

  function getAllCourses(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getAllCourseList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.courses && res.data.ScannedCount !== undefined) {
          //Get users for each course in the list of all courses
          res.data.courses.forEach((course: CourseType) => {
            Get(getUsersInCourse(course.id), signal).then(res => {
              if (res && res.status && res.status < 300) {
                if (res.data) {
                  //Get the list of all users in the group
                  setUserList((prev) => {
                    if (prev.find(x => x.course.id === course.id)) {
                      //if the course has already been added, skip
                      //this is a react strict mode work around so we dont get doubles
                      return prev
                    } else {
                      return [...prev, { users: res.data, course: course }];
                    }
                  });
                }
              } else if (res && res.status === 401) {
                navigator("/login");
              } else {
                // handle error
                // setError("No courses Found");
              }
            });
          })

          //if the data is 20 courses, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getAllCourses(res.data.LastEvaluatedKey.id, signal);
          } else {
            setIsLoading(false);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setIsLoading(false);
        }
      }
    });
  }

  return !isLoading ? (
    <div className="reports">
      <h3>Reports</h3>
      <hr />
      <List style={style}>
        {userList.map((x, index) => {
          return (
            <div style={{ width: "100%", marginBottom: "0.4rem" }} key={index}>
              <Accordion sx={{ border: "1px solid rgba(0,0,0,0.2)" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <div>
                    <h6>{x.course.name ? x.course.name : ""}</h6>
                    <div>{x.course.section ?
                      `${x.course.term ? x.course.term : ""} ${x.course.year ? x.course.year : ""} - ${x.course.section}` :
                      `${x.course.term ? x.course.term : ""} ${x.course.year ? x.course.year : ""}`}</div>
                  </div>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: "rgba(0,0,0,0.2)" }}>

                  <div>Instructor: {x.course.instructor.name + " " + x.course.instructor.family_name}</div>
                  <div>Sign up code: {x.course.signUpCode}</div>
                  <hr />
                  <Box sx={{ width: '100%', bgcolor: 'background.paper', padding: "0.2rem", borderRadius: "0.2rem" }}>
                    <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                      <ListItemText primary={`Student Name`} />
                      <ListItemText primary={`Email`} sx={{ textAlign: "end" }} />
                    </ListItem>
                    <hr />
                    {x.users.map((row, i) => (
                      <div key={i}>
                        <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                          {/* redirect to chat with and pass params  */}
                          <Link
                            to={`/reports/${row.sub}`}
                            state={row}
                            style={{ textAlign: "left", display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}
                          >
                            <ListItemText primary={row.name + " " + row.family_name} />
                            <ListItemText primary={row.email} sx={{ textAlign: "end" }} />
                          </Link>
                        </ListItem>
                        {i !== x.users.length - 1 ? ( //only have dividers between modules
                          <Divider />
                        ) : <></>}
                      </div>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </div>
          )
        })}
      </List>
    </div >
  ) : (
    <LinearProgress />
  )
}