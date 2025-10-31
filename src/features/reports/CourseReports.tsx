/**
 * CourseReports.tsx, parent component for an individual course's report
 * Handles fetching and analyzing course data, then rendering through ClassCharts.tsx
 */
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import { CourseType } from "../../utility/types/CourseTypes";
import ClassCharts from "./ClassCharts";
import { CustomUserType } from "../../utility/types/UserTypes";
import { analyzeCourse } from "../../utility/reports/analysis";
import {
  getCourse,
  getUsersInCourse,
} from "../../utility/endpoints/CourseEndpoints";
import {
  getContentModMessage,
  getConversation,
  getConversationList,
} from "../../utility/endpoints/ConversationEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Loader2 } from "lucide-react";

export default function CourseReports(): JSX.Element {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);

  // Get course and users from navigation state
  const courseData = location.state?.course;
  const usersData = location.state?.users;

  const [course, setCourse] = useState<CourseType | null>(courseData || null);
  const [users, setUsers] = useState<Array<CustomUserType>>(usersData || []);
  const [isLoading, setIsLoading] = useState<boolean>(!courseData);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<any | null>(null);

  useEffect(() => {
    if (!courseId || !user) return;

    // If we have course data from navigation state, use it
    if (courseData && usersData) {
      setCourse(courseData);
      setUsers(usersData);
      setIsLoading(false);
      return;
    }

    // If no course data, fetch course and users by courseId

    const controller = new AbortController();
    setIsLoading(true);
    // Fetch course details

    Get(getCourse(courseId), controller.signal, true).then((courseRes) => {
      if (
        courseRes &&
        courseRes.status &&
        courseRes.status < 300 &&
        courseRes.data
      ) {
        const fetchedCourse = courseRes.data as CourseType;
        setCourse(fetchedCourse);
        // Fetch users (handle pagination)
        const allUsers: Array<CustomUserType> = [];
        const fetchUsersPage = (nextToken?: string) => {
          Get(
            getUsersInCourse(courseId, 50, nextToken ?? ""),
            controller.signal,
            true
          ).then((usersRes) => {
            if (
              usersRes &&
              usersRes.status &&
              usersRes.status < 300 &&
              usersRes.data
            ) {
              if (usersRes.data.users) {
                allUsers.push(...usersRes.data.users);
              }
              if (usersRes.data.nextToken) {
                fetchUsersPage(usersRes.data.nextToken);
              } else {
                setUsers(allUsers);
                setIsLoading(false);
              }
            } else if (usersRes && usersRes.status === 401) {
              navigate("/login");
            } else {
              console.error("CourseReports: getUsersInCourse failed", usersRes);
              setIsLoading(false);
            }
          });
        };
        fetchUsersPage();
      } else if (courseRes && courseRes.status === 401) {
        navigate("/login");
      } else {
        console.error(
          "CourseReports: getCourse failed, retrying shortly...",
          courseRes
        );
        // This is really messy solution, but it works for now
        // Better fix would be to have some other timeout for the retry
        // Retry once after a short delay; keep loading UI
        setTimeout(() => {
          if (!controller.signal.aborted) {
            Get(getCourse(courseId), controller.signal, true).then(
              (retryRes) => {
                if (
                  retryRes &&
                  retryRes.status &&
                  retryRes.status < 300 &&
                  retryRes.data
                ) {
                  const fetchedCourse = retryRes.data as CourseType;
                  setCourse(fetchedCourse);
                  const allUsers: Array<CustomUserType> = [];
                  const fetchUsersPage = (nextToken?: string) => {
                    Get(
                      getUsersInCourse(courseId, 50, nextToken ?? ""),
                      controller.signal,
                      true
                    ).then((usersRes) => {
                      if (
                        usersRes &&
                        usersRes.status &&
                        usersRes.status < 300 &&
                        usersRes.data
                      ) {
                        if (usersRes.data.users) {
                          allUsers.push(...usersRes.data.users);
                        }
                        if (usersRes.data.nextToken) {
                          fetchUsersPage(usersRes.data.nextToken);
                        } else {
                          setUsers(allUsers);
                          setIsLoading(false);
                        }
                      } else if (usersRes && usersRes.status === 401) {
                        navigate("/login");
                      } else {
                        console.error(
                          "CourseReports: getUsersInCourse failed on retry, retrying again...",
                          usersRes
                        );
                        setTimeout(() => fetchUsersPage(nextToken), 1500);
                      }
                    });
                  };
                  fetchUsersPage();
                } else if (retryRes && retryRes.status === 401) {
                  navigate("/login");
                } else {
                  console.error(
                    "CourseReports: retry getCourse failed; giving up for now",
                    retryRes
                  );
                  setIsLoading(false);
                  setAlert({
                    message: `Unable to load course data${
                      retryRes?.status ? ` (status ${retryRes.status})` : ""
                    }.`,
                    type: "error",
                  });
                }
              }
            );
          }
        }, 1500);
      }
    });

    return () => controller.abort();
  }, [courseId, user, courseData, usersData, setAlert, navigate]);

  // Helper function to get conversation data
  const getConvo = React.useCallback(
    async (
      courseId: string,
      moduleId: string,
      convoIndex: string,
      username: string,
      controller: AbortController
    ): Promise<any> => {
      const temp = await Get(
        getConversation(courseId, moduleId, convoIndex, username),
        controller.signal,
        true
      ).then(async (res1: any) => {
        if (res1 && res1.status && res1.status < 300) {
          if (res1.data) {
            if (res1.data.completed) {
              const temp2 = await Get(
                getContentModMessage(courseId, moduleId, convoIndex, username),
                controller.signal,
                true
              ).then(async (res2: any) => {
                if (res2 && res2.status && res2.status < 300) {
                  if (res2.data && res2.data[0]) {
                    var tmp = res1.data;
                    tmp.messages.push(res2.data[0]);
                    return tmp;
                  }
                } else if (res2 && res2.status === 401) {
                  navigate("/login");
                }
              });
              return await temp2;
            } else {
              return res1.data;
            }
          }
        } else if (res1 && res1.status === 401) {
          navigate("/login");
        } else {
          var some = await getConvo(
            courseId,
            moduleId,
            convoIndex,
            username,
            controller
          );
          return some;
        }
      });
      return await temp;
    },
    [navigate]
  );

  // Function to get conversation list for a specific user and module
  const getConvoListForClick = React.useCallback(
    async (
      courseId: string,
      moduleId: string,
      user: CustomUserType,
      controller: AbortController,
      courseData: any,
      courseIndex: number,
      moduleIndex: number
    ): Promise<any> => {
      const temp = await Get(
        getConversationList(courseId, moduleId, user.username),
        controller.signal,
        true
      ).then(async (res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
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
          navigate("/login");
        } else {
          if (res && res.name === "AxiosError") {
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
    },
    [navigate, getConvo]
  );

  // Run analysis when course and users are loaded
  useEffect(() => {
    if (!course || users.length === 0 || isLoading) return;

    const runAnalysis = async () => {
      setIsLoadingAnalysis(true);
      try {
        const controller = new AbortController();

        // Create the same structure as in Reports.tsx
        const courseData = {
          ...course,
          users: users,
          modules: course.modules.map((module) => ({
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
                course.id,
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

        const analysisResult = analyzeCourse(courseData);
        setAnalysis(analysisResult);
      } catch (error) {
        console.error("Error fetching conversation data:", error);
        setAlert({
          message: "Error loading course data. Please try again.",
          type: "error",
        });
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    runAnalysis();
  }, [course, users, isLoading, setAlert, getConvoListForClick]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Course Data</p>
        </div>
      </div>
    );
  }

  if (isLoadingAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">
            Analyzing course data and generating reports...
          </p>
        </div>
      </div>
    );
  }

  // If analysis isn't ready yet, show a preparing state instead of rendering charts with null
  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-lg">Preparing analysis...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-lg">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <ClassCharts
      analysis={analysis}
      setAnalysis={(newAnalysis: any) => {
        setAnalysis(newAnalysis);
        if (newAnalysis === null) {
          // Navigate back to reports when analysis is cleared
          navigate("/reports");
        }
      }}
    />
  );
}
