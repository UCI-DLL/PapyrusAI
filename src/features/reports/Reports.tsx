import {
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Button,
  Checkbox,
  ListItemButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import {
  getAllCourseList,
  getCourse,
  getUsersInCourse,
  getAllMessages,
} from "../../utility/endpoints/CourseEndpoints";
import LinearProgress from "@mui/material/LinearProgress";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import ClassCharts from "../reports/ClassCharts";
import { Link } from "react-router-dom";
import { CustomUserType } from "../../utility/types/UserTypes";
import { analyzeCourse } from "./analysis";
import { Modal } from "../../components/Modal";
import {
  ConversationType,
  MessageType,
} from "../../utility/types/ConversationTypes";
import {
  getContentModMessage,
  getConversation,
  getConversationList,
} from "../../utility/endpoints/ConversationEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type DownloadType = CourseType & { users: Array<CustomUserType> } & {
  modules: Array<
    ModuleType & {
      conversations: Array<ConversationType & { user: CustomUserType }>;
    }
  >;
};

export default function Reports(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [userList, setUserList] = useState<
    Array<{ users: Array<CustomUserType>; course: CourseType }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [openDownloadCourseModal, setOpenDownloadCourseModal] =
    useState<boolean>(false);
  const [downloadType, setDownloadType] = useState<string>("json");
  const [analysis, setAnalysis] = useState<any | null>(null);
  const style = {
    width: "100%",
    bgcolor: "background.paper",
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
      if (
        user &&
        user.groups &&
        user.groups.find((a) =>
          a.includes(
            process.env.REACT_APP_ADMIN
              ? process.env.REACT_APP_ADMIN
              : "PapyrusAIAdmin"
          )
        )
      ) {
        getAllCourses("", controller.signal);
      } else {
        user.groups.forEach((group) => {
          //skip instructor or student or admin groups
          //remove TAs also
          if (
            group ===
              (process.env.REACT_APP_INSTRUCTOR
                ? process.env.REACT_APP_INSTRUCTOR
                : "PapyrusAIInstructors") ||
            group ===
              (process.env.REACT_APP_ADMIN
                ? process.env.REACT_APP_ADMIN
                : "PapyrusAIAdmin") ||
            group.includes("-TA")
          ) {
            return "";
          }
          Get(getCourse(group), controller.signal).then((res1) => {
            if (res1 && res1.status && res1.status < 300) {
              if (
                res1.data &&
                res1.data.instructor &&
                (res1.data.instructor.username === user.username ||
                  (res1.data.taList &&
                    res1.data.taList.find(
                      (a: CustomUserType) => a.username === user.username
                    ))) //handle tas too
              ) {
                //only get the rest of the information if current user is instructor
                getUsersInCourseList(res1.data, controller.signal);
              }
            } else if (res1 && res1.status === 401) {
              navigator("/login");
            } else {
              //handle errors
            }
          });
        });
      }

      setIsLoading(false);
    }

    return () => {
      setUserList([]);
      controller.abort();
    };

    // eslint-disable-next-line
  }, []);

  function getAllCourses(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getAllCourseList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (
          res.data &&
          res.data.courses &&
          res.data.ScannedCount !== undefined
        ) {
          //Get users for each course in the list of all courses
          res.data.courses.forEach((course: CourseType) => {
            getUsersInCourseList(course, signal);
          });

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

  function getUsersInCourseList(
    course: CourseType,
    signal: AbortSignal,
    nextToken?: string
  ) {
    var limit = 25;
    //Note: add true to Get function so that it will try again if it fails
    Get(getUsersInCourse(course.id, limit, nextToken), signal, true).then(
      async (res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get the list of all users in the group
            setUserList((prev) => {
              if (prev.find((x) => x.course.id === course.id)) {
                //if the course has already been added, add the new list of users
                var temp = [...prev];
                var index = prev.findIndex((x) => x.course.id === course.id);
                var prevUserList = prev[index].users ? prev[index].users : [];
                temp[index] = {
                  users: prevUserList.concat(res.data.users),
                  course: course,
                };
                return temp;
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
          if (res.name && res.name === "AxiosError") {
            //if 502 error (since we cant have too many lambdas running at once), try again later cause we have a too many requests error
            setTimeout(async () => {
              var some = await getUsersInCourseList(course, signal, nextToken);
              return some;
            }, 5000);
          }
        }
        setIsLoading(false);
      }
    );
  }

  // Function for click handler that replicates the same logic as getConvoList
  async function getConvoListForClick(
    courseId: string,
    moduleId: string,
    user: CustomUserType,
    controller: AbortController,
    courseData: any,
    courseIndex: number,
    moduleIndex: number
  ): Promise<any> {
    const temp = await Get(
      getConversationList(courseId, moduleId, user.username),
      controller.signal,
      true
    ).then(async (res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //get conversation data (with message data)
          if (res.data.conversations && res.data.conversations.length > 0) {
            const conversationPromises = res.data.conversations.map(
              async (convo: any, convoIndex: number) => {
                var convoData = await getConvo(
                  courseId,
                  moduleId,
                  convoIndex.toString(),
                  user.username,
                  controller
                );
                if (convoData) {
                  var convoData2 = { ...convoData, user: user };
                  // check if convo list already has convo with same id to prevent duplicates
                  if (
                    !courseData.modules[moduleIndex].conversations.some(
                      (e: any) => e.id === convoData2.id
                    )
                  ) {
                    courseData.modules[moduleIndex].conversations.push(
                      convoData2
                    );
                  }
                }
                return convoData;
              }
            );

            await Promise.all(conversationPromises);
          }
        }
        return res.data;
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        //Do nothing and skip. The user doesnt have any conversations within the course/module
        if (res.name && res.name === "AxiosError") {
          const delay = 2000 + Math.random() * 1000;
          setTimeout(async () => {
            var some = await getConvoListForClick(
              courseId,
              moduleId,
              user,
              controller,
              courseData,
              courseIndex,
              moduleIndex
            );
            return some;
          }, delay);
        }
      }
    });
    return await temp;
  }

  function sortCourseList(
    list: Array<{ users: Array<CustomUserType>; course: CourseType }>
  ) {
    return list.sort((a, b) => {
      const isCreatedByCurrentUserA =
        a.course.instructor.username === user?.username;
      const isCreatedByCurrentUserB =
        b.course.instructor.username === user?.username;

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
    });
  }

  function downloadCourses() {
    setOpenDownloadCourseModal(false);
    setIsLoading(true);
    var coursesToDownload: DownloadType[] = [];
    checked.forEach((x) => {
      var course: any = sortCourseList(userList)[x].course;
      course["users"] = sortCourseList(userList)[x].users;
      coursesToDownload.push(course);
    });
    // Both download methods will be using this as the controller
    const controller = new AbortController();
    // If "CSV Mode" is checked on, run this section instead of the logic below
    switch (downloadType) {
      case "csv": {
        const courseIds = coursesToDownload.map((course) => course.id);
        // TODO: Get convoIds instead of courseIds for optimal query performance in backend or (just make the backend support it)
        downloadUserMessagesAsCsv(courseIds, controller);
        break;
      }
      case "json": {
        //For each course, for each module in course, for each user in course, get conversation list
        // (for length of array) and then the actual convo
        coursesToDownload.forEach((course, courseIndex) => {
          course.modules.forEach((module, moduleIndex) => {
            //create conversation array if it doesnt exist
            if (
              coursesToDownload[courseIndex].modules[moduleIndex]
                .conversations === undefined
            ) {
              coursesToDownload[courseIndex].modules[
                moduleIndex
              ].conversations = [];
            }
            course.users.forEach((user) => {
              //get conversation list based on course and module and user
              promiseArray.push(
                getConvoList(
                  course.id,
                  module.id,
                  user,
                  controller,
                  coursesToDownload,
                  courseIndex,
                  moduleIndex
                )
              );
            });
          });
        });

        Promise.allSettled(promiseArray).then(() => {
          // download here
          setTimeout(() => {
            downloadObjectAsJson(coursesToDownload, `PapyrusAI_courses`);
            setIsLoading(false);
          }, 10000);
        });
        break;
      }
      case "txt": {
        //get conversations within the courses
        //For each course, for each module in course, for each user in course, get conversation list
        //(for length of array) and then the actual convo
        coursesToDownload.forEach((course, courseIndex) => {
          course.modules.forEach((module, moduleIndex) => {
            //create conversation array if it doesnt exist
            if (
              coursesToDownload[courseIndex].modules[moduleIndex]
                .conversations === undefined
            ) {
              coursesToDownload[courseIndex].modules[
                moduleIndex
              ].conversations = [];
            }
            course.users.forEach((user) => {
              //get conversation list based on course and module and user
              promiseArray.push(
                getConvoList(
                  course.id,
                  module.id,
                  user,
                  controller,
                  coursesToDownload,
                  courseIndex,
                  moduleIndex
                )
              );
            });
          });
        });

        Promise.allSettled(promiseArray).then(() => {
          // download here
          setTimeout(() => {
            downloadTxtZip(coursesToDownload, `PapyrusAI_courses`);
          }, 10000);
        });
        break;
      }
      default: {
        console.error("Invalid downloadType value");
        setAlert({
          message: "Could not download data. Try again later.",
          type: "error",
        });
      }
    }
  }

  async function downloadTxtZip(exportObj: any, exportName: string) {
    //convert each conversation to txt
    const zip = new JSZip();

    //for each course, module, conversation create a txt file
    exportObj.forEach((courseInfo: any) => {
      courseInfo.modules.forEach((moduleInfo: any) => {
        moduleInfo.conversations.forEach(
          (converation: any, convoIndex: number) => {
            var fileData =
              courseInfo.name +
              "\n" +
              moduleInfo.name +
              "\n" +
              courseInfo.instructor.name +
              " " +
              courseInfo.instructor.family_name +
              "\n";
            if (converation.user) {
              fileData += "User: " + converation.user.email + "\n";
            }
            fileData += "Conversation Index: " + convoIndex + "\n";
            fileData += "Conversation ID: " + converation.id + "\n";
            var sortedMessages = converation.messages.sort(
              (a: MessageType, b: MessageType) =>
                parseInt(a.timestamp) - parseInt(b.timestamp)
            );
            sortedMessages.forEach((message: any) => {
              var dateTime = new Date(
                parseInt(message.id.substring(0, 13), 10)
              ).toLocaleString();
              var sender =
                message.sender === "ChatGPT"
                  ? "Papyrus"
                  : converation.user.name + " " + converation.user.family_name;
              fileData +=
                sender + " - " + dateTime + "\n" + message.content + "\n\n";
            });

            //add txt files to zip file and download
            zip.file(
              `${courseInfo.name}/${moduleInfo.name}/${converation.user.email}_${convoIndex}.txt`,
              fileData
            );
          }
        );
      });
    });

    // Generate the zip file as a Blob
    const zipContent = await zip.generateAsync({ type: "blob" });
    // Trigger the download
    saveAs(zipContent, `${exportName}.zip`);
    setIsLoading(false);
  }

  async function getConvoList(
    courseId: string,
    moduleId: string,
    user: CustomUserType,
    controller: AbortController,
    coursesToDownload: DownloadType[],
    courseIndex: number,
    moduleIndex: number
  ): Promise<any> {
    //Note: add true to Get function so that it will try again if it fails
    const temp = await Get(
      getConversationList(courseId, moduleId, user.username),
      controller.signal,
      true
    ).then(async (res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //check if conversation for course, module, user / get conversation list length
          //get conversation data (with message data)
          if (res.data.conversations && res.data.conversations.length > 0) {
            res.data.conversations.forEach(
              async (convo: any, convoIndex: number) => {
                var convoData = await getConvo(
                  courseId,
                  moduleId,
                  convoIndex.toString(),
                  user.username,
                  controller
                );
                promiseArray.push(convoData);
                if (convoData) {
                  var convoData2 = { ...convoData, user: user };
                  // push to convo list because it will be a list of ALL convos from all users
                  // check if convo list already has convo with same id to prevent duplicates
                  if (
                    !coursesToDownload[courseIndex].modules[
                      moduleIndex
                    ].conversations.some((e) => e.id === convoData2.id)
                  ) {
                    coursesToDownload[courseIndex].modules[
                      moduleIndex
                    ].conversations.push(convoData2);
                  }
                }
              }
            );
          }
        }
        return res.data;
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        //Do nothing and skip. The user doesnt have any conversations within the course/module
        if (res.name && res.name === "AxiosError") {
          //if 502 error (since we cant have too many lambdas running at once), try again later cause we have a too many requests error
          const delay = 2000 + Math.random() * 1000;
          setTimeout(async () => {
            var some = await getConvoList(
              courseId,
              moduleId,
              user,
              controller,
              coursesToDownload,
              courseIndex,
              moduleIndex
            );
            promiseArray.push(some);
            return some;
          }, delay);
        }
      }
    });
    return await temp;
  }

  //helper function to get the conversation for the json download
  async function getConvo(
    courseId: string,
    moduleId: string,
    convoIndex: string,
    username: string,
    controller: AbortController
  ): Promise<any> {
    //Note: add true to Get function so that it will try again if it fails
    const temp = await Get(
      getConversation(courseId, moduleId, convoIndex, username),
      controller.signal,
      true
    ).then(async (res1: any) => {
      if (res1 && res1.status && res1.status < 300) {
        if (res1.data) {
          //handle content moderation messages
          if (res1.data.completed) {
            //Note: add true to Get function so that it will try again if it fails
            const temp2 = await Get(
              getContentModMessage(courseId, moduleId, convoIndex, username),
              controller.signal,
              true
            ).then(async (res2: any) => {
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
        var some = await getConvo(
          courseId,
          moduleId,
          convoIndex,
          username,
          controller
        );
        promiseArray.push(some);
        return some;
      }
    });
    return await temp;
  }

  //code from: https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
  function downloadObjectAsJson(exportObj: any, exportName: string) {
    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportObj, null, 2));
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  function downloadStringAsCsv(csvContent: string, fileName: string) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function downloadUserMessagesAsCsv(
    courseIds: string[],
    controller: AbortController
  ) {
    setIsLoading(true);
    getUserMessagesAsCsv(courseIds, controller)
      .then((csv) => downloadStringAsCsv(csv, "PapyrusAI_messages"))
      .finally(() => setIsLoading(false));
  }

  function getUserMessagesAsCsv(
    courseIds: string[],
    controller: AbortController,
    accCsv: string = "",
    lastKeyId?: string,
    lastModuleId?: string
  ): Promise<string> {
    return Get(
      getAllMessages(courseIds, lastKeyId, lastModuleId),
      controller.signal
    ).then((res) => {
      if (res && res.status && res.status < 300) {
        const chunkCsv: string = res.data.csv!;
        if (accCsv === "") {
          // First chunk keeps the header
          accCsv = chunkCsv;
        } else {
          // All other chunks drop the header line
          const [, ...dataLines] = chunkCsv.split("\n");
          accCsv += "\n" + dataLines.join("\n");
        }
        // Get next pagination keys, if any
        const nextKeyId = res.data?.LastEvaluatedKeyId;
        const nextModuleId = res.data?.LastEvaluatedKeyModuleId;
        // Call the next endpoint if it is incomplete, recursively
        if (nextKeyId && nextModuleId) {
          return getUserMessagesAsCsv(
            courseIds,
            controller,
            accCsv,
            nextKeyId,
            nextModuleId
          );
        } else {
          return accCsv.trim();
        }
      } else if (res?.status === 401) {
        navigator("/login");
        return Promise.reject(new Error("Unauthorized"));
      } else {
        // Log and return whatever was leftover
        console.info(`Unhandled response status: ${res?.status}`, res);
        return accCsv.trim();
      }
    });
  }

  return !analysis ? (
    !isLoading ? (
      isLoadingAnalysis ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <LinearProgress />
          <p style={{ marginTop: "1rem", fontSize: "1.1rem", color: "#666" }}>
            Analyzing course data and generating reports...
          </p>
        </div>
      ) : (
        <div className="reports">
          {user?.groups.includes(
            process.env.REACT_APP_ADMIN
              ? process.env.REACT_APP_ADMIN
              : "PapyrusAIAdmin"
          ) && (
            <Modal
              isOpen={openDownloadCourseModal}
              title={"Select Courses to Download"}
              onRequestClose={() => setOpenDownloadCourseModal(false)}
              actions={
                <>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setOpenDownloadCourseModal(false)}
                  >
                    Close
                  </Button>
                  <Button variant="contained" onClick={downloadCourses}>
                    Download
                  </Button>
                </>
              }
            >
              <div>
                <div>
                  Note: downloading multiple courses may take several minutes.
                  Please be patient while your courses, modules, and
                  conversations download.
                </div>
                <FormControl
                  size="small"
                  sx={{ width: "100%", marginTop: "1rem" }}
                >
                  <InputLabel id="download-format-label">
                    Download Format
                  </InputLabel>
                  <Select
                    labelId="download-format-label"
                    id="download-format"
                    value={downloadType}
                    label="Download Format"
                    onChange={(e) => setDownloadType(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="json">JSON</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="txt">TXT</MenuItem>
                  </Select>
                </FormControl>
                <List dense sx={{ width: "100%", bgcolor: "background.paper" }}>
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
                            inputProps={{ "aria-labelledby": labelId }}
                          />
                        }
                        disablePadding
                      >
                        <ListItemButton onClick={handleToggle(index)}>
                          <ListItemText
                            id={labelId}
                            primary={`${x.course.name} | Instructor: ${x.course.instructor.name} ${x.course.instructor.family_name}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </div>
            </Modal>
          )}
          {/* Reports UI */}
          <div className="reports__section-header">
            <h3>Reports</h3>
            <div>
              {user?.groups.includes(
                process.env.REACT_APP_ADMIN
                  ? process.env.REACT_APP_ADMIN
                  : "PapyrusAIAdmin"
              ) && (
                <Button
                  variant="outlined"
                  onClick={() => setOpenDownloadCourseModal(true)}
                >
                  Download Course
                </Button>
              )}
            </div>
          </div>
          <div>
            Reports summarize users’ activity and interactions with the AI in
            your courses. For any course of which you are the instructor, you
            may view specific students’ interactions with AI. For more
            information on reports please see the{" "}
            <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.bsxols4iy4zg"
              target="_blank"
              rel="noreferrer"
            >
              “Instructor Reports” section of our instructor guide
            </a>
            .
          </div>
          <hr />
          {/* Work within here to update UI */}
          <List style={style}>
            {sortCourseList(userList).map((x, index) => {
              const handleRowClick = async () => {
                console.log("Course Information:", {
                  course: x.course,
                  students: x.users,
                  studentCount: x.users.length,
                  courseId: x.course.id,
                  courseName: x.course.name,
                  instructor: x.course.instructor,
                  term: x.course.term,
                  year: x.course.year,
                  section: x.course.section,
                  signUpCode: x.course.signUpCode,
                  modules: x.course.modules,
                  organization: x.course.organization,
                  createdTimestamp: x.course.createdTimestamp,
                  isActive: x.course.isActive,
                });

                // Fetch conversation data to create the same structure as JSON download
                console.log(
                  "Fetching conversation data (same as JSON download)..."
                );
                setIsLoadingAnalysis(true);
                try {
                  const controller = new AbortController();

                  // Create the same structure as coursesToDownload
                  const courseData = {
                    ...x.course,
                    users: x.users,
                    modules: x.course.modules.map((module) => ({
                      ...module,
                      conversations: [],
                    })),
                  };

                  // Use the same logic as JSON download
                  const promiseArray: any[] = [];

                  courseData.modules.forEach((module, moduleIndex) => {
                    courseData.users.forEach((user) => {
                      promiseArray.push(
                        getConvoListForClick(
                          x.course.id,
                          module.id,
                          user,
                          controller,
                          courseData,
                          0, // courseIndex is always 0 since we're only processing one course
                          moduleIndex
                        )
                      );
                    });
                  });

                  // Wait for all conversations to be fetched
                  await Promise.all(promiseArray);

                  console.log(
                    "Complete Course Data with Conversations:",
                    courseData
                  );

                  // For troubleshooting to validate conversation data exists
                  const totalConversations =
                    courseData.modules?.reduce(
                      (sum, module) =>
                        sum + (module.conversations?.length || 0),
                      0
                    ) || 0;

                  if (totalConversations === 0) {
                    console.warn(
                      "No conversations found in course data, analysis may return empty results"
                    );
                  }

                  const analysis = analyzeCourse(courseData);
                  setAnalysis(analysis);
                  console.log("analysis", analysis);
                } catch (error) {
                  console.error("Error fetching conversation data:", error);
                } finally {
                  setIsLoadingAnalysis(false);
                }
              };

              return (
                <div
                  style={{ width: "100%", marginBottom: "0.4rem" }}
                  key={index}
                >
                  <ListItem
                    button
                    onClick={handleRowClick}
                    sx={{
                      border: "1px solid rgba(0,0,0,0.2)",
                      borderRadius: "4px",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.08)",
                      },
                      padding: "1rem",
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div>
                          <h6
                            style={{
                              margin: "0 0 0.5rem 0",
                              fontSize: "1.1rem",
                              fontWeight: "600",
                            }}
                          >
                            {x.course.name ? x.course.name : "Unnamed Course"}
                          </h6>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "rgba(0,0,0,0.7)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Instructor:{" "}
                            {x.course.instructor.name +
                              " " +
                              x.course.instructor.family_name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "rgba(0,0,0,0.7)",
                            }}
                          >
                            {x.course.section
                              ? `${x.course.term ? x.course.term : ""} ${
                                  x.course.year ? x.course.year : ""
                                } - ${x.course.section}`
                              : `${x.course.term ? x.course.term : ""} ${
                                  x.course.year ? x.course.year : ""
                                }`}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "rgba(0,0,0,0.7)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Sign up code: {x.course.signUpCode}
                          </div>
                          <div
                            style={{
                              fontSize: "1rem",
                              fontWeight: "600",
                              color: "rgba(0,0,0,0.8)",
                            }}
                          >
                            {x.users.length} Students
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "rgba(0,0,0,0.6)",
                          fontStyle: "italic",
                        }}
                      >
                        Click to view course details
                      </div>
                    </div>
                  </ListItem>
                </div>
              );
            })}
          </List>
        </div>
      )
    ) : (
      <LinearProgress />
    )
  ) : (
    <ClassCharts
      analysis={analysis}
      setAnalysis={(newAnalysis: any) => {
        setAnalysis(newAnalysis);
        if (newAnalysis === null) {
          setIsLoadingAnalysis(false);
        }
      }}
    />
  );
}
