import React, { useEffect, useState, useContext } from "react";
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
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";

export default function UserReports(): JSX.Element {
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
  const [viewUser, setViewUser] = useState<UserType>();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);

  useEffect(() => {
    const controller = new AbortController();
    if (
      location.pathname.split("/")[1] === "reports" &&
      location.pathname.split("/")[2] &&
      user
    ) {
      //Get viewUser information
      const username = location.pathname.split("/")[2];
      getSpecificUser(username, controller.signal);

      //get list of conversation
      //TODO handle pagination of conversation lists later when reports is more defined
      Get(getUserConversationList(username), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get the list of all conversations
            //for each courseid, get the course data
            res.data.map((conversation: any) => {
              Get(getCourse(conversation.courseId), controller.signal).then(
                (res1) => {
                  if (res1 && res1.status && res1.status < 300) {
                    if (
                      res1.data &&
                      res1.data.instructor &&
                      (res1.data.instructor.username === user.username ||
                        (res1.data.taList &&
                          res1.data.taList.find(
                            (a: CustomUserType) => a.username === user.username
                          )) || //handle tas too
                        user.groups.includes(
                          process.env.REACT_APP_ADMIN
                            ? process.env.REACT_APP_ADMIN
                            : "PapyrusAIAdmin"
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
                }
              );
              return "";
            });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
        }
        setIsLoading(false);
      });
    }

    return () => {
      setConversationList([]);
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location]);

  function getSpecificUser(username: string, signal: AbortSignal) {
    //get user details
    Get(getUserData(username), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          setViewUser(res.data);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          //handle error
          setAlert({ message: "Could not find user", type: "error" });
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
              onClick={() => navigator("/reports")}
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
          <h2 className="text-2xl font-bold text-foreground mb-1">User:</h2>
          <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
            {viewUser
              ? `${viewUser.name} ${viewUser.family_name}`
              : "User Reports"}
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>
            The user report page summarizes a specific user's interactions with
            AI in all of the courses of which you are an instructor. To view a
            user's conversations within a given module, click "List
            Conversations" on the row for your desired module.
          </p>
        </div>

        {conversationList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "#666",
            }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-1">
              No Data Available
            </h2>
            <p style={{ fontSize: "1.1rem" }}>
              No conversation data available for this user. This could mean:
            </p>
            <ul
              style={{
                textAlign: "left",
                display: "inline-block",
                marginTop: "1rem",
                fontSize: "1rem",
              }}
            >
              <li>The user hasn't had any conversations yet</li>
              <li>You don't have access to this user's data</li>
              <li>The user hasn't been enrolled in any courses</li>
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
                              (largest, current) =>
                                parseInt(current) > parseInt(largest)
                                  ? current
                                  : largest,
                              row.conversations[0].messages[0]
                            ) >
                              y.messages.reduce(
                                (largest, current) =>
                                  parseInt(current) > parseInt(largest)
                                    ? current
                                    : largest,
                                row.conversations[0].messages[0]
                              )
                              ? x
                              : y,
                          row.conversations[0]
                        )
                        .messages.reduce(
                          (largest, current) =>
                            parseInt(current) > parseInt(largest)
                              ? current
                              : largest,
                          row.conversations[0].messages[0]
                        )
                    : "";
                if (tempTime) {
                  tempTime = new Date(
                    parseInt(tempTime.substring(0, 13), 10)
                  ).toLocaleString();
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
                          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                            {row.course.name}
                          </h3>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                              Module:{" "}
                              {
                                row.course.modules.find(
                                  (x) => x.id === row.moduleId
                                )?.name
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Last Accessed: {tempTime}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-base font-semibold text-foreground mb-2">
                            {row.conversations.length} Conversations
                          </div>
                          <Button
                            onClick={() =>
                              navigator(
                                `/courses/${row.courseId}/modules/${row.moduleId}/username/${viewUser?.username}`
                              )
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            List Conversations
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground italic">
                        Click "List Conversations" to view detailed interactions
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
    <Card className="w-[99%] mx-auto my-2 shadow-md transition-shadow">
      <CardContent className="p-4">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "4px",
              backgroundColor: "#e5e7eb",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#3b82f6",
                animation: "loading 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
