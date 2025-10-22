/**
 * Reports.tsx, parent component for all reports pages
 * Structure: Reports -(route)> CourseReports -> ClassCharts
 * From ClassCharts, can navigate to StudentPage( & IndividualStudentStats)
 * ClassCharts also renders StudentMenu (select students) &
 * StudentListPopup (view all students, views user's conversations -> UserReports)
 */

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
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
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
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Loader2, Download, BarChart3, Search } from "lucide-react";
import { Input } from "../../components/ui/input";

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
  const [openDownloadCourseModal, setOpenDownloadCourseModal] =
    useState<boolean>(false);
  const [downloadType, setDownloadType] = useState<string>("json");
  var promiseArray: any[] = [];

  const [checked, setChecked] = useState<Array<number>>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

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
          if (res && res.name === "AxiosError") {
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

  function filterCoursesBySearch(
    courses: Array<{ users: Array<CustomUserType>; course: CourseType }>,
    searchTerm: string
  ) {
    if (!searchTerm.trim()) {
      return courses;
    }

    const lowercaseSearch = searchTerm.toLowerCase();
    return courses.filter(({ course }) => {
      const courseName = course.name?.toLowerCase() || "";
      const instructorName =
        `${course.instructor.name} ${course.instructor.family_name}`.toLowerCase();
      const section = course.section?.toLowerCase() || "";
      const term = course.term?.toLowerCase() || "";
      const year = course.year?.toString() || "";

      return (
        courseName.includes(lowercaseSearch) ||
        instructorName.includes(lowercaseSearch) ||
        section.includes(lowercaseSearch) ||
        term.includes(lowercaseSearch) ||
        year.includes(lowercaseSearch)
      );
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
        if (res && res.name && res.name === "AxiosError") {
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

  return !isLoading ? (
    <div className="min-h-screen">
      <div className="mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg mb-8">
            <div
              className="absolute top-0 right-0 w-48 h-48 opacity-10"
              aria-hidden="true"
            >
              <BarChart3 size={192} className="text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                    Reports
                  </h1>
                  <p className="text-muted-foreground max-w-2xl text-base leading-6">
                    Reports summarize users' activity and interactions with the
                    AI in your courses. For any course of which you are the
                    instructor, you may view specific students' interactions
                    with AI. For more information on reports please see the{" "}
                    <a
                      href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.bsxols4iy4zg"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:no-underline text-primary font-medium"
                    >
                      "Instructor Reports" section of our instructor guide
                    </a>
                    .
                  </p>
                </div>
                <div>
                  {user?.groups.includes(
                    process.env.REACT_APP_ADMIN
                      ? process.env.REACT_APP_ADMIN
                      : "PapyrusAIAdmin"
                  ) && (
                    <Button
                      variant="outline"
                      onClick={() => setOpenDownloadCourseModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Course
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {user?.groups.includes(
          process.env.REACT_APP_ADMIN
            ? process.env.REACT_APP_ADMIN
            : "PapyrusAIAdmin"
        ) && (
          <Dialog
            open={openDownloadCourseModal}
            onOpenChange={setOpenDownloadCourseModal}
          >
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Select Courses to Download
                </DialogTitle>
                <DialogDescription>
                  Choose the courses you want to download and select the format.
                  Note: downloading multiple courses may take several minutes.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="download-format">Download Format</Label>
                  <Select value={downloadType} onValueChange={setDownloadType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="txt">TXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Available Courses</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-4">
                    {filterCoursesBySearch(
                      sortCourseList(userList),
                      searchTerm
                    ).map((x, index) => {
                      const labelId = `checkbox-list-secondary-label-${index}`;
                      return (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent"
                        >
                          <Checkbox
                            id={labelId}
                            checked={checked.includes(index)}
                            onCheckedChange={handleToggle(index)}
                          />
                          <Label
                            htmlFor={labelId}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {x.course.name} | Instructor:{" "}
                            {x.course.instructor.name}{" "}
                            {x.course.instructor.family_name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenDownloadCourseModal(false)}
                >
                  Close
                </Button>
                <Button onClick={downloadCourses}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <section aria-labelledby="reports-courses-heading">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2
                id="reports-courses-heading"
                className="text-2xl font-bold text-foreground mb-1"
              >
                Course Reports
              </h2>
              <p className="text-muted-foreground text-sm">
                Click on any course to view detailed analytics and student
                interactions.
              </p>
            </div>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses by name, instructor, section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </header>

          <div className="space-y-4">
            {filterCoursesBySearch(sortCourseList(userList), searchTerm)
              .length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No courses found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm.trim()
                    ? `No courses match "${searchTerm}". Try adjusting your search terms.`
                    : "No courses available."}
                </p>
              </div>
            ) : (
              filterCoursesBySearch(sortCourseList(userList), searchTerm).map(
                (x, index) => {
                  const handleRowClick = () => {
                    // Navigate to the new course reports route with course data
                    // Pass the course object and users as state
                    navigator(`/reports/course/${x.course.id}`, {
                      state: {
                        course: x.course,
                        users: x.users,
                      },
                    });
                  };

                  return (
                    <Card
                      key={index}
                      className="group bg-card border rounded-xl hover-lift shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md"
                      onClick={handleRowClick}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                              {x.course.name ? x.course.name : "Unnamed Course"}
                            </h3>
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">
                                Instructor: {x.course.instructor.name}{" "}
                                {x.course.instructor.family_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {x.course.section
                                  ? `${x.course.term ? x.course.term : ""} ${
                                      x.course.year ? x.course.year : ""
                                    } - ${x.course.section}`
                                  : `${x.course.term ? x.course.term : ""} ${
                                      x.course.year ? x.course.year : ""
                                    }`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-muted-foreground mb-1">
                              Sign up code: {x.course.signUpCode}
                            </div>
                            <div className="text-base font-semibold text-foreground">
                              {x.users.length} Students
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground italic">
                          Click to view course details
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              )
            )}
          </div>
        </section>
      </div>
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Reports</p>
      </div>
    </div>
  );
}
