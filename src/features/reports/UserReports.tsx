import React, { useEffect, useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Get from "../../utility/Get";
import { getUserConversationList } from "../../utility/endpoints/ConversationEndpoints";
import { ConversationType } from "../../utility/types/ConversationTypes";
import { CourseType } from "../../utility/types/CourseTypes";
import { CustomUserType, UserType } from "../../utility/types/UserTypes";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { UserContext } from "../../utility/context/UserContext";
import { getUserData, logEvent } from "../../utility/endpoints/UserEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { isNetworkError, createNetworkErrorHandler } from "../../utility/reports/networkErrorHandler";
import Post from "../../utility/Post";

export default function UserReports(): JSX.Element {
  const { t } = useTranslation();
  let navigator = useNavigate();
  let location = useLocation();
  const [conversationList, setConversationList] = useState<
    Array<{
      conversations: Array<ConversationType>;
      course: CourseType;
      courseId: string;
      moduleId: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const retryCountRef = useRef<number>(0);
  const retryAttemptedRef = useRef<boolean>(false);

  // Track loading status (no console output)
  useEffect(() => {
    // no-op
  }, [isLoading]);
  const [viewUser, setViewUser] = useState<UserType>();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);

  // Helper function to handle network errors with retry logic
  const handleNetworkError = createNetworkErrorHandler(retryAttemptedRef, setAlert, navigator, t, setIsLoading);

  useEffect(() => {
    const controller = new AbortController();
    retryAttemptedRef.current = false;
    if (location.pathname.split("/")[1] === "reports" && location.pathname.split("/")[2] && user) {
      //Get viewUser information
      const username = location.pathname.split("/")[2];
      getSpecificUser(username, controller.signal);

      //log page
      Post(logEvent(), {
        eventType: "view_page",
        metadata: {
          username: username,
          page: "user_reports",
        }
      })

      //get list of conversation
      //TODO handle pagination of conversation lists later when reports is more defined
      const fetchConversations = () => {
        Get(getUserConversationList(username), controller.signal, true).then((res) => {
          // Check for network error first
          if (isNetworkError(res)) {
            handleNetworkError(res, fetchConversations);
            return;
          }

          if (res === undefined) {
            if (retryCountRef.current < 3) {
              retryCountRef.current += 1;

              setTimeout(() => {
                fetchConversations();
              }, 2000);
              return;
            } else {
              setIsLoading(false);
              return;
            }
          }

          // Reset retry count on successful response
          retryCountRef.current = 0;
          if (retryAttemptedRef.current) {
            console.log("[UserReports] fetchConversations retry succeeded", {
              username,
              timestamp: new Date().toISOString(),
            });
            retryAttemptedRef.current = false;
          }

          if (res && res.status && res.status < 300) {
            if (res.data) {
              // Track how many course fetches we need to complete
              let completedFetches = 0;
              const totalFetches = res.data.length;

              const loadCourse = (conversation: any) => {
                Get(getCourse(conversation.courseId), controller.signal, true).then((res1) => {
                  // Check for network error
                  if (isNetworkError(res1)) {
                    handleNetworkError(res1, () => {
                      console.log("[UserReports] loadCourse retry attempt", {
                        courseId: conversation.courseId,
                        timestamp: new Date().toISOString(),
                      });
                      loadCourse(conversation);
                    });
                    return;
                  }

                  completedFetches++;

                  if (res1 && res1.status && res1.status < 300) {
                    if (retryAttemptedRef.current) {
                      console.log("[UserReports] getCourse retry succeeded", {
                        courseId: conversation.courseId,
                        timestamp: new Date().toISOString(),
                      });
                      retryAttemptedRef.current = false;
                    }
                    if (
                      res1.data &&
                      res1.data.instructor &&
                      (res1.data.instructor.username === user.username ||
                        (res1.data.taList &&
                          res1.data.taList.find((a: CustomUserType) => a.username === user.username)) || //handle tas too
                        user.groups.includes(
                          process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin",
                        )) //or if an admin
                    ) {
                      //set conversation data
                      setConversationList((prev) => [
                        ...prev,
                        {
                          conversations: conversation.conversations,
                          course: res1.data,
                          courseId: conversation.courseId,
                          moduleId: conversation.moduleId,
                        },
                      ]);
                    }
                  } else if (res1 && res1.status === 401) {
                    navigator("/login");
                  } else {
                    //handle errors
                  }

                  // Only set loading to false when all course fetches are complete
                  if (completedFetches === totalFetches) {
                    setIsLoading(false);
                  }
                });
              };

              //Get the list of all conversations
              //for each courseid, get the course data
              res.data.map((conversation: any) => {
                loadCourse(conversation);
                return "";
              });

              // If no conversations to process, set loading to false immediately
              if (totalFetches === 0) {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // handle error

            setIsLoading(false);
          }
        });
      };

      fetchConversations();
    }

    return () => {
      setConversationList([]);
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location]);

  function getSpecificUser(username: string, signal: AbortSignal) {
    //get user details
    Get(getUserData(username), signal, true).then((res) => {
      // Check for network error
      if (isNetworkError(res)) {
        handleNetworkError(res, () => {
          console.log("[UserReports] getSpecificUser retry attempt", { username, timestamp: new Date().toISOString() });
          getSpecificUser(username, signal);
        });
        return;
      }

      if (res && res.status && res.status < 300) {
        if (retryAttemptedRef.current) {
          console.log("[UserReports] getSpecificUser retry succeeded", {
            username,
            timestamp: new Date().toISOString(),
          });
          retryAttemptedRef.current = false;
        }
        if (res.data) {
          setViewUser(res.data);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          //handle error
          setAlert({ message: t("errorMessage.userNotFound"), type: "error" });
        }
      }
    });
  }

  return !isLoading ? (
    <Card className="w-[99%] mx-auto my-2 shadow-md transition-shadow">
      <CardContent className="p-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ cursor: "pointer" }}>
            <ArrowBackIcon
              onClick={() => navigator(-1)}
              style={{
                fontSize: "3rem",
                padding: "0.5rem",
                margin: "0.5rem",
                color: "#666",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#1976d2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#666";
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "2rem", padding: "0 2rem" }}>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {t("reports.student")}: {viewUser ? `${viewUser.name} ${viewUser.family_name}` : "User Reports"}
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>{t("reports.studentReportDescription")}</p>
        </div>

        {conversationList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "#666",
            }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-1">{t("reports.noData")}</h2>
            <p style={{ fontSize: "1.1rem" }}>{t("reports.noDataStudentDescription")}:</p>
            <ul
              style={{
                textAlign: "left",
                display: "inline-block",
                marginTop: "1rem",
                fontSize: "1rem",
              }}
            >
              <li>{t("reports.noDataStudentDescription1")}</li>
              <li>{t("reports.noDataStudentDescription2")}</li>
              <li>{t("reports.noDataStudentDescription3")}</li>
            </ul>
          </div>
        ) : (
          <div style={{ padding: "0 2rem" }}>
            <div className="space-y-4">
              {conversationList.map((row, index) => {
                //Get the time of last accessed
                var tempTime =
                  row.conversations && row.conversations.length > 0
                    ? row.conversations
                      .reduce(
                        (x, y) =>
                          x.messages.length > 0 &&
                            y.messages.length > 0 &&
                            x.messages.reduce(
                              (largest, current) => (parseInt(current) > parseInt(largest) ? current : largest),
                              row.conversations[0].messages[0],
                            ) >
                            y.messages.reduce(
                              (largest, current) => (parseInt(current) > parseInt(largest) ? current : largest),
                              row.conversations[0].messages[0],
                            )
                            ? x
                            : y,
                        row.conversations[0],
                      )
                      .messages.reduce(
                        (largest, current) => (parseInt(current) > parseInt(largest) ? current : largest),
                        row.conversations[0].messages[0],
                      )
                    : "";
                if (tempTime) {
                  tempTime = new Date(parseInt(tempTime.substring(0, 13), 10)).toLocaleString();
                } else {
                  tempTime = "N/A";
                }

                return (
                  <Card
                    key={index}
                    className="group bg-card border rounded-xl hover-lift shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <h2
                            className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary dark:group-hover:text-gold 
                          colorful-dark:group-hover:text-gold transition-colors duration-300"
                          >
                            {row.course.name}
                          </h2>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                              {t("common.module")}: {row.course.modules.find((x) => x.id === row.moduleId)?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t("reports.lastAccessed")}: {tempTime}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-base font-semibold text-foreground mb-2">
                            {row.conversations.length} {t("reports.conversations")}
                          </div>
                          <Button
                            onClick={() =>
                              navigator(
                                `/courses/${row.courseId}/modules/${row.moduleId}/username/${viewUser?.username}`,
                              )
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {t("reports.listConversations")}
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground italic">
                        {t("reports.listConversationsDescription")}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  ) : (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-lg">{t("loadingMessage.userDataConversations")}</p>
      </div>
    </div>
  );
}
