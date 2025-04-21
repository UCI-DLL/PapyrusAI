import {
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Checkbox,
  ListItemButton,
  FormControlLabel
} from "@mui/material";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import { getAllCourseList, getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import LinearProgress from '@mui/material/LinearProgress';
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import { Link } from "react-router-dom";
import { CustomUserType } from "../../utility/types/UserTypes";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Modal } from "../../components/Modal";
import { ConversationType } from "../../utility/types/ConversationTypes";
import { getContentModMessage, getConversation, getConversationList } from "../../utility/endpoints/ConversationEndpoints";
import { getAllData2 } from "../../utility/endpoints/DataCsvEndpoints";


export default function Reports(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [userList, setUserList] = useState<Array<{ users: Array<CustomUserType>, course: CourseType }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [openDownloadCourseModal, setOpenDownloadCourseModal] = useState<boolean>(false);
  const [researchCSV, setResearchCSV] = useState(false);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };
  var promiseArray: any[] = [];

  const [checked, setChecked] = useState<Array<number>>([]);

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
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
                (res1.data.instructor.username === user.username || (
                  res1.data.taList &&
                  res1.data.taList.find((a: CustomUserType) => a.username === user.username) //handle tas too
                ))
              ) { //only get the rest of the information if current user is instructor
                getUsersInCourseList(res1.data, controller.signal);
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
            getUsersInCourseList(course, signal)
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

  function getUsersInCourseList(course: CourseType, signal: AbortSignal, nextToken?: string) {
    var limit = 25;
    Get(getUsersInCourse(course.id, limit, nextToken), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //Get the list of all users in the group
          setUserList((prev) => {
            if (prev.find(x => x.course.id === course.id)) {
              //if the course has already been added, add the new list of users
              var temp = [...prev];
              var index = prev.findIndex(x => x.course.id === course.id);
              var prevUserList = prev[index].users ? prev[index].users : [];
              temp[index] = { users: prevUserList.concat(res.data.users), course: course }
              return temp
            } else {
              return [...prev, { users: res.data.users, course: course }];
            }
          });

          //if the we get a nexttoken, then call for the next page
          //handle pages
          if (res.data.nextToken) {
            getUsersInCourseList(course, signal, res.data.nextToken);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // handle error
      }
      setIsLoading(false);
    });
  }

  function sortCourseList(list: Array<{ users: Array<CustomUserType>, course: CourseType }>) {
    return list.sort((a, b) => {
      const isCreatedByCurrentUserA = a.course.instructor.username === user?.username;
      const isCreatedByCurrentUserB = b.course.instructor.username === user?.username;

      if (isCreatedByCurrentUserA && !isCreatedByCurrentUserB) {
        return -1; // a comes before b
      } else if (!isCreatedByCurrentUserA && isCreatedByCurrentUserB) {
        return 1; // b comes before a
      } else {
        // Both are either created by the current user or not, so sort by creation date
        const dateA = parseInt(a.course.createdTimestamp);
        const dateB = parseInt(b.course.createdTimestamp);
        return dateB - dateA; // Newest first
      }
    })
  }

  function downloadCourses() {
    setOpenDownloadCourseModal(false);
    setIsLoading(true);
    type DownloadType = CourseType & { users: Array<CustomUserType> } & { modules: Array<ModuleType & { conversations: Array<ConversationType & { user: CustomUserType }> }> }
    var coursesToDownload: DownloadType[] = [];
    checked.forEach(x => {
      var course: any = sortCourseList(userList)[x].course;
      course["users"] = sortCourseList(userList)[x].users;
      coursesToDownload.push(course);
    })
    // Both download methods will be using this as the controller
    const controller = new AbortController();
    // If "CSV Mode" is checked on, run this section instead of the logic below
    if (researchCSV) {
      // Get a list of all courseIds selected
      const courseIds = coursesToDownload.map(course => course.id);
      setTimeout(() => {
        downloadCoursesAsCsv(courseIds, controller);
        setIsLoading(false);
      }, 10000);
    return;
  }

    //For each course, for each module in course, for each user in course, get conversation list (for length of array) and then the actual convo
    coursesToDownload.forEach((course, courseIndex) => {
      course.modules.forEach((module, moduleIndex) => {
        //create conversation array if it doesnt exist
        if (coursesToDownload[courseIndex].modules[moduleIndex].conversations === undefined) {
          coursesToDownload[courseIndex].modules[moduleIndex].conversations = [];
        }
        course.users.forEach(user => {
          //get conversation list based on course and module and user
          promiseArray.push(Get(getConversationList(course.id, module.id, user.sub), controller.signal).then(res => {
            if (res && res.status && res.status < 300) {
              if (res.data) {
                //check if conversation for course, module, user / get conversation list length
                //get conversation data (with message data)
                if (res.data.conversations && res.data.conversations.length > 0) {
                  res.data.conversations.forEach(async (convo: any, convoIndex: number) => {
                    var convoData = await getConvo(course.id, module.id, convoIndex.toString(), user.sub, controller);
                    promiseArray.push(convoData);
                    if (convoData) {
                      var convoData2 = { ...convoData, user: user }
                      // save convo data in the main json in the right place in coursesToDownload
                      // push to convo list because it will be a list of ALL convos from all users 
                      // check if convo list already has convo with same id to prevent duplicates
                      if (!coursesToDownload[courseIndex].modules[moduleIndex].conversations.some(e => e.id === convoData2.id)) {
                        coursesToDownload[courseIndex].modules[moduleIndex].conversations.push(convoData2);
                      }
                    }
                  })
                }
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              //Do nothing and skip. The user doesnt have any conversations within the course/module
            }
          }))
        })
      })
    })

    Promise.allSettled(promiseArray).then(() => {
      // download here
      setTimeout(() => {
        downloadObjectAsJson(coursesToDownload, `PapyrusAI_courses`);
        setIsLoading(false);
      }, 10000);
    });
  }

  //helper function to get the conversation for the json download
  async function getConvo(courseId: string, moduleId: string, convoIndex: string, username: string, controller: AbortController): Promise<any> {
    const temp = await Get(
      getConversation(
        courseId,
        moduleId,
        convoIndex,
        username
      ),
      controller.signal).then(async (res1: any) => {
        if (res1 && res1.status && res1.status < 300) {
          if (res1.data) {
            //handle content moderation messages
            if (res1.data.completed) {
              const temp2 = await Get(
                getContentModMessage(
                  courseId,
                  moduleId,
                  convoIndex,
                  username
                ),
                controller.signal).then(async (res2: any) => {
                  if (res2 && res2.status && res2.status < 300) {
                    //add content mod message to res1 data before returning
                    //"should" only be one in the list
                    if (res2.data && res2.data[0]) {
                      var tmp = res1.data;
                      tmp.messages.push(res2.data[0]);
                      return tmp;
                    }
                  } else if (res2 && res2.status === 401) {
                    navigator("/login");
                  } else {
                    //do nothing
                  }
                });
              return await temp2;
            } else {
              return res1.data;
            }
          }
        } else if (res1 && res1.status === 401) {
          navigator("/login");
        } else {
          //if 502 error (since we cant have too many lambdas running at once), try again later cause we have a too many requests error
          var some = await getConvo(courseId, moduleId, convoIndex, username, controller);
          promiseArray.push(some)
          return some;
        }
      });
    return await temp;
  }

  //code from: https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
  function downloadObjectAsJson(exportObj: any, exportName: string) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  async function downloadCoursesAsCsv(courseIds: string[], controller: AbortController) {
    // Get the data as a CSV
    const csvContent = await getUserMessagesAsCsv(courseIds, controller);
    // Blob + Object URL approach, using this approach I found since it can handle larger loads at once
    // Create a blob and trigger a download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Messages_Data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function getUserMessagesAsCsv(courseIds: string[], controller: AbortController): Promise<string> {
    let allCsv = "";
    let lastKeyId: string | undefined;
    let lastModuleId: string | undefined;
    let isFirstPage = true;

    // Paginate through the getAllData2 based on keys returned
    while (isFirstPage || (lastKeyId && lastModuleId)) {
      const res = await Get(getAllData2(courseIds, lastKeyId, lastModuleId), controller.signal);
      // If response is successful, save the csv data
      if (res && res.status && res.status < 300) {
        if (res.data?.csv) {
          const chunkCsv: string = res.data?.csv ?? "";
          if (chunkCsv) {
            // If it is the first chunk, keep the headers
            if (isFirstPage) {
              allCsv += chunkCsv;
              isFirstPage = false;
            } else {
              // Separate by "new lines"
              const lines = chunkCsv.split("\n");
              // Drop the header line, then join the rest
              const [, ...dataLines] = lines;
              allCsv += "\n" + dataLines.join("\n");
            }
          }
          // Update the LCV
          lastKeyId = res.data?.LastEvaluatedKeyId;
          lastModuleId = res.data?.LastEvaluatedKeyModuleId;
        }
      } else if (res?.status === 401) {
        navigator("/login");
        return allCsv;
      }
      // "if 502 error (since we cant have too many lambdas running at once), try again later cause we have a too many requests error"
      else {
        // Nothing for now, not sure how to handle this edge case yet
        console.info(`Unhandled response status: ${res.status}`, res);
      }
    }
    return allCsv;
  }

  return !isLoading ? (
    <div className="reports">
      {user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") && (
        <Modal
          isOpen={openDownloadCourseModal}
          title={"Select Courses to Download"}
          onRequestClose={() => setOpenDownloadCourseModal(false)}
          actions={
            <>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setOpenDownloadCourseModal(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={downloadCourses}>
                Download
              </Button>
            </>
          }
        >
          <div>
            <div>Note: downloading multiple courses may take several minutes. Please be patient while your courses, modules, and conversations download.</div>
            <List dense sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {sortCourseList(userList).map((x, index) => {
                const labelId = `checkbox-list-secondary-label-${index}`;
                return (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <Checkbox
                        edge="end"
                        onChange={handleToggle(index)}
                        checked={checked.includes(index)}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    }
                    disablePadding
                  >
                    <ListItemButton onClick={handleToggle(index)}>
                      <ListItemText id={labelId} primary={`${x.course.name} | Instructor: ${x.course.instructor.name} ${x.course.instructor.family_name}`} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            <FormControlLabel
              label="Download as CSV"
              labelPlacement="start"
              control={
                <Checkbox
                  checked={researchCSV}
                  onChange={e => setResearchCSV(e.target.checked)}
                  size="small"
                />
              }
            />
          </div>
        </Modal>
      )}
      <div className="reports__section-header">
        <h3>Reports</h3>
        <div>
          {user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") && (
            <Button variant="outlined" onClick={() => setOpenDownloadCourseModal(true)}>Download Course</Button>
          )}
        </div>
      </div>
      <hr />
      <List style={style}>
        {sortCourseList(userList).map((x, index) => {
          return (
            <div style={{ width: "100%", marginBottom: "0.4rem" }} key={index}>
              <Accordion sx={{ border: "1px solid rgba(0,0,0,0.2)" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <div>
                    <h6>{x.course.name ? x.course.name : ""}</h6>
                    <div>Instructor: {x.course.instructor.name + " " + x.course.instructor.family_name}</div>
                    <div>{x.course.section ?
                      `${x.course.term ? x.course.term : ""} ${x.course.year ? x.course.year : ""} - ${x.course.section}` :
                      `${x.course.term ? x.course.term : ""} ${x.course.year ? x.course.year : ""}`}</div>
                  </div>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                  <div>Sign up code: {x.course.signUpCode}</div>
                  <div>Number of Students: {x.users.length}</div>
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
                            to={`/reports/${row.username}`}
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