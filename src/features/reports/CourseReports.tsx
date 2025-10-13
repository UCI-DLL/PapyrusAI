import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import { CourseType } from "../../utility/types/CourseTypes";
import ClassCharts from "./ClassCharts";
import { CustomUserType } from "../../utility/types/UserTypes";
import { analyzeCourse } from "../../utility/reports/analysis";
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

    console.log(
      "CourseReports: Course data from navigation state:",
      courseData
    );
    console.log("CourseReports: Users data from navigation state:", usersData);

    // If we have course data from navigation state, use it
    if (courseData && usersData) {
      console.log("CourseReports: Using course data from navigation state");
      setCourse(courseData);
      setUsers(usersData);
      setIsLoading(false);
      return;
    }

    // If no course data, redirect back to reports
    console.log("CourseReports: No course data found, redirecting to reports");
    setAlert({
      message: "Course data not found. Please try again from the reports page.",
      type: "error",
    });
    navigate("/reports");
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

        console.log("Complete Course Data with Conversations:", courseData);

        const analysisResult = analyzeCourse(courseData);
        setAnalysis(analysisResult);
        console.log("analysis", analysisResult);
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
    console.log("CourseReports: Rendering loading state");
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

  if (!course) {
    console.log("CourseReports: Course is null, rendering course not found");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-lg">Course not found</p>
        </div>
      </div>
    );
  }

  console.log("CourseReports: Rendering ClassCharts with analysis:", analysis);
  return (
    <ClassCharts
      analysis={analysis}
      setAnalysis={(newAnalysis: any) => {
        console.log("CourseReports: setAnalysis called with:", newAnalysis);
        setAnalysis(newAnalysis);
        if (newAnalysis === null) {
          console.log(
            "CourseReports: Analysis is null, navigating back to reports"
          );
          // Navigate back to reports when analysis is cleared
          navigate("/reports");
        }
      }}
    />
  );
}
