/**
 * ModuleReports.tsx, component for displaying reports for a specific module
 */
//TODO: update this to be generic

import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { buildStyles, CircularProgressbarWithChildren } from "react-circular-progressbar";
import { CheckCircle2, X, ChevronLeft, ChevronRight, BarChart3, MessageSquare, Users, Loader2 } from "lucide-react";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import { getCourse, getRaterModuleData, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { CustomUserType } from "../../utility/types/UserTypes";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import {
  getUserConversationList,
  getConversationList,
  getConversation,
} from "../../utility/endpoints/ConversationEndpoints";
import {
  calculateModuleStatistics,
  processStudentConversationData,
  StudentConversationData,
  ModuleStatistics,
} from "../../utility/reports/moduleAnalysis";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { PageLoader, PageHeaderCard } from "../../components/Common";

interface Column {
  id:
    | "name"
    | "convos"
    | "essays"
    | "lead"
    | "position"
    | "claim"
    | "counterclaim"
    | "rebuttal"
    | "evidence"
    | "conclude";
  label: string;
  minWidth?: number;
  align?: "right";
  format?: (value: number) => string;
}

const columns: readonly Column[] = [
  { id: "name", label: "Name", minWidth: 100 },
  { id: "convos", label: "Num Convos", minWidth: 75 },
  { id: "essays", label: "Num Essays", minWidth: 75 },
  { id: "lead", label: "Lead", minWidth: 100 },
  {
    id: "position",
    label: "Position",
    minWidth: 100,
  },
  { id: "claim", label: "Claim", minWidth: 100 },
  {
    id: "counterclaim",
    label: "Counterclaim",
    minWidth: 100,
  },
  {
    id: "rebuttal",
    label: "Rebuttal",
    minWidth: 100,
  },
  {
    id: "evidence",
    label: "Evidence",
    minWidth: 100,
  },
  {
    id: "conclude",
    label: "Concluding Summary",
    minWidth: 100,
  },
];

interface Data {
  name: string;
  convos: number;
  essays: number;
  lead: boolean;
  position: boolean;
  claim: boolean;
  counterclaim: boolean;
  rebuttal: boolean;
  evidence: boolean;
  conclude: boolean;
  username: string;
}

function createData(
  name: string,
  convos: number,
  essays: number,
  lead: boolean,
  position: boolean,
  claim: boolean,
  counterclaim: boolean,
  rebuttal: boolean,
  evidence: boolean,
  conclude: boolean,
  username: string,
): Data {
  return {
    name,
    convos,
    essays,
    lead,
    position,
    claim,
    counterclaim,
    rebuttal,
    evidence,
    conclude,
    username,
  };
}

type RaterDataType = {
  content: Array<Array<string>>;
  conversationIndex: string;
  courseId: string;
  id: string;
  input: string; // essay
  moduleId: string;
  timestamp: string;
  username: string;
};

export default function ModuleReports(): JSX.Element {
  let navigator = useNavigate();
  let location = useLocation();
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [raterData, setRaterData] = useState<Array<RaterDataType>>([]);
  const [error, setError] = useState<string>();
  const [userList, setUserList] = useState<Array<CustomUserType & { numConvos: number }>>([]);
  const [courseData, setCourseData] = useState<CourseType>();
  const [moduleData, setModuleData] = useState<ModuleType>();
  const [rows, setRows] = useState<Array<Data>>([]);
  const [stats, setStats] = useState<{
    lead: number;
    position: number;
    claim: number;
    counterClaim: number;
    rebuttal: number;
    evidence: number;
    conclude: number;
  }>();
  const [moduleStatistics, setModuleStatistics] = useState<ModuleStatistics | null>(null);
  const [studentConversationData, setStudentConversationData] = useState<StudentConversationData[]>([]);
  const [conversationDataMap, setConversationDataMap] = useState<
    Record<string, Array<{ conversations: Array<{ messages?: Array<{ timestamp?: number | string }> }> }>>
  >({});

  useEffect(() => {
    const controller = new AbortController();
    if (user) {
      setIsLoading(true);
      const pathParts = location.pathname.split("/");
      if (pathParts[1] === "reports" && pathParts[2] === "module" && pathParts[3] && pathParts[4]) {
        const courseId = pathParts[3];
        const moduleId = pathParts[4];

        //Get user list
        if (userList.length === 0) {
          getUsersInCourseList(courseId, moduleId, controller.signal);
        }

        //Get course and module data
        Get(getCourse(courseId), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data.modules) {
              setCourseData(res.data);
              const module = res.data.modules.find((mod: ModuleType) => mod.id === moduleId);
              setModuleData(module);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setError("Course Does Not Exist");
              setIsLoading(false);
            }
          }
        });

        //Get rater data for module
        Get(getRaterModuleData(courseId, moduleId), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //Get rater data for the module
              res.data.forEach((item: any) => {
                //convert the rater info to 2d array
                const rater = item.content.split("\n").map((row: string) => row.split(","));
                setRaterData((prev) => [...prev, { ...item, content: rater }]);
              });
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              if (res === undefined) {
              } else {
                // handle error
                setError("No Data Found");
              }
            }
            setIsLoading(false);
          }
        });
      }
      setIsLoading(false);
    }

    return () => {
      setRaterData([]);
      setUserList([]);
      setRows([]);
      controller.abort();
    };

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (userList.length > 0 && raterData.length > 0) {
      userList.forEach((user) => {
        const userRater = raterData.filter((e) => e.username === user.username);
        const row = createData(
          user.name + " " + user.family_name,
          user.numConvos,
          userRater.length,
          userRater.some((e) => e.content.some((c) => c[4] === "0")),
          userRater.some((e) => e.content.some((c) => c[4] === "1")),
          userRater.some((e) => e.content.some((c) => c[4] === "2")),
          userRater.some((e) => e.content.some((c) => c[4] === "3")),
          userRater.some((e) => e.content.some((c) => c[4] === "4")),
          userRater.some((e) => e.content.some((c) => c[4] === "5")),
          userRater.some((e) => e.content.some((c) => c[4] === "6")),
          user.username,
        );
        setRows((prev) => {
          const newArray = [...prev];
          if (newArray.some((p) => p.username === row.username)) {
            //if user is in the list already, just update it
            const index = newArray.findIndex((p) => p.username === row.username);
            newArray[index] = row;
            return newArray;
          } else {
            //otherwise, just add new row
            return [...prev, row];
          }
        });
      });
    } else if (userList.length > 0 && moduleData && !moduleData.raterEnabled) {
      //for modules that are not rater enabled, then just list out the students
      userList.forEach((user) => {
        const row = createData(
          user.name + " " + user.family_name,
          user.numConvos,
          0,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          user.username,
        );
        setRows((prev) => {
          const newArray = [...prev];
          if (newArray.some((p) => p.username === row.username)) {
            //if user is in the list already, just update it
            const index = newArray.findIndex((p) => p.username === row.username);
            newArray[index] = row;
            return newArray;
          } else {
            //otherwise, just add new row
            return [...prev, row];
          }
        });
      });
    }
  }, [userList, raterData, moduleData]);

  useEffect(() => {
    if (raterData.length > 0) {
      //calculate class stats
      setStats({
        lead: Math.round(getAverageOfDiscourseType(raterData, "0") * 100),
        position: Math.round(getAverageOfDiscourseType(raterData, "1") * 100),
        claim: Math.round(getAverageOfDiscourseType(raterData, "2") * 100),
        counterClaim: Math.round(getAverageOfDiscourseType(raterData, "3") * 100),
        rebuttal: Math.round(getAverageOfDiscourseType(raterData, "4") * 100),
        evidence: Math.round(getAverageOfDiscourseType(raterData, "5") * 100),
        conclude: Math.round(getAverageOfDiscourseType(raterData, "6") * 100),
      });
    }
  }, [raterData]);

  // Calculate module statistics when user list and conversation data are available
  useEffect(() => {
    if (userList.length > 0 && Object.keys(conversationDataMap).length > 0) {
      const processedData = processStudentConversationData(userList, conversationDataMap);
      // Sort by last name (family_name) first, then first name
      const sortedData = [...processedData].sort((a, b) => {
        const lastNameA = (a.family_name || "").toLowerCase();
        const lastNameB = (b.family_name || "").toLowerCase();
        if (lastNameA !== lastNameB) {
          return lastNameA.localeCompare(lastNameB);
        }
        // If last names are the same, sort by first name
        const firstNameA = (a.name || "").toLowerCase();
        const firstNameB = (b.name || "").toLowerCase();
        return firstNameA.localeCompare(firstNameB);
      });
      setStudentConversationData(sortedData);
      const stats = calculateModuleStatistics(sortedData);
      setModuleStatistics(stats);
    } else if (userList.length > 0 && Object.keys(conversationDataMap).length === 0) {
      // If no conversation data yet, still process with what we have
      const processedData = processStudentConversationData(userList, {});
      // Sort by last name (family_name) first, then first name
      const sortedData = [...processedData].sort((a, b) => {
        const lastNameA = (a.family_name || "").toLowerCase();
        const lastNameB = (b.family_name || "").toLowerCase();
        if (lastNameA !== lastNameB) {
          return lastNameA.localeCompare(lastNameB);
        }
        // If last names are the same, sort by first name
        const firstNameA = (a.name || "").toLowerCase();
        const firstNameB = (b.name || "").toLowerCase();
        return firstNameA.localeCompare(firstNameB);
      });
      setStudentConversationData(sortedData);
      const stats = calculateModuleStatistics(sortedData);
      setModuleStatistics(stats);
    }
  }, [userList, conversationDataMap]);

  function getAverageOfDiscourseType(raterArray: Array<RaterDataType>, type: string) {
    let totalCount = 0;
    let arrayLength = raterArray.length;

    //this calculates how many essays have a discourse type of all essays
    raterArray.forEach((item) => {
      let leadEntries = item.content.filter((e) => e[4] === type);
      totalCount += leadEntries.length > 0 ? 1 : 0;
    });
    return totalCount > 0 ? totalCount / arrayLength : 0;
  }

  const fetchConversationDataForStudents = async (
    courseId: string,
    moduleId: string,
    students: Array<CustomUserType & { numConvos: number }>,
    signal: AbortSignal,
  ) => {
    const conversationMap: Record<
      string,
      Array<{ conversations: Array<{ messages?: Array<{ timestamp?: number | string }> }> }>
    > = {};

    // Fetch conversation list and then fetch each conversation with messages
    for (const student of students) {
      if (student.numConvos > 0) {
        try {
          const convoListRes = await Get(getConversationList(courseId, moduleId, student.username), signal, true);
          if (convoListRes && convoListRes.status && convoListRes.status < 300 && convoListRes.data?.conversations) {
            const conversationsWithMessages = await Promise.all(
              convoListRes.data.conversations.map(async (_: any, index: number) => {
                try {
                  const convoRes = await Get(
                    getConversation(courseId, moduleId, index.toString(), student.username),
                    signal,
                    true,
                  );
                  if (convoRes && convoRes.status && convoRes.status < 300 && convoRes.data) {
                    return {
                      messages: convoRes.data.messages || [],
                    };
                  }
                  return { messages: [] };
                } catch (error) {
                  return { messages: [] };
                }
              }),
            );

            conversationMap[student.username] = [
              {
                conversations: conversationsWithMessages,
              },
            ];
          }
        } catch (error) {
          // Handle error silently
        }
      }
    }

    setConversationDataMap(conversationMap);
  };

  function getUsersInCourseList(course: string, module: string, signal: AbortSignal, nextToken?: string) {
    var limit = 25;
    Get(getUsersInCourse(course, limit, nextToken), signal).then(async (res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.users) {
          const usersWithConvos: Array<CustomUserType & { numConvos: number }> = [];

          //filter out current user and email_verified
          await Promise.all(
            res.data.users.map(async (u: CustomUserType) => {
              const convoRes = await Get(getUserConversationList(u.username), signal);
              if (convoRes && convoRes.status && convoRes.status < 300) {
                if (convoRes.data) {
                  //Get the list of all conversations
                  //for the specific courseid and moduleid, get the number of conversations for the user
                  const temp = convoRes.data.find((con: any) => con.courseId === course && con.moduleId === module);
                  const tempObj = {
                    name: u.name,
                    family_name: u.family_name,
                    email: u.email,
                    sub: u.sub,
                    username: u.username,
                    numConvos: temp && temp.conversations ? temp.conversations.length : 0,
                  };
                  usersWithConvos.push(tempObj);
                  setUserList((prev) => [...prev, tempObj]);
                }
              } else if (convoRes && convoRes.status === 401) {
                navigator("/login");
              }
            }),
          );

          // Fetch conversation data with messages for statistics
          if (usersWithConvos.length > 0) {
            await fetchConversationDataForStudents(course, module, usersWithConvos, signal);
          }

          //if the we get a nexttoken, then call for the next page
          //handle pages
          if (res.data.nextToken) {
            getUsersInCourseList(course, module, signal, res.data.nextToken);
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

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value: string) => {
    setRowsPerPage(+value);
    setPage(0);
  };

  // Sort rows by last name (extracted from name field which is "firstName lastName")
  const sortedRows = [...rows].sort((a, b) => {
    // Extract last name from "firstName lastName" format
    const namePartsA = a.name.split(" ");
    const namePartsB = b.name.split(" ");
    const lastNameA = (namePartsA[namePartsA.length - 1] || "").toLowerCase();
    const lastNameB = (namePartsB[namePartsB.length - 1] || "").toLowerCase();
    if (lastNameA !== lastNameB) {
      return lastNameA.localeCompare(lastNameB);
    }
    // If last names are the same, sort by first name
    const firstNameA = (namePartsA[0] || "").toLowerCase();
    const firstNameB = (namePartsB[0] || "").toLowerCase();
    return firstNameA.localeCompare(firstNameB);
  });

  const totalRows = moduleData?.raterEnabled ? sortedRows.length : studentConversationData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  return !isLoading ? (
    <main className="bg-background text-foreground p-4 space-y-6">
      {error ? (
        <div className="bg-destructive/15 border border-destructive rounded-lg p-4" role="alert">
          <p className="text-destructive font-medium text-center">{error}</p>
        </div>
      ) : (
        <>
          <PageHeaderCard
            title={`${courseData?.name || "Course"} - ${moduleData?.name || "Module"}`}
            icon={<BarChart3 size={192} className="text-primary" />}
          />

          <div className="text-muted-foreground max-w-2xl">
            On this page, you can view the overall usage within this module. If you wish to view a specific user's
            activity, click on their name to access their conversations.
          </div>

          {/* Overall Statistics Cards */}
          {moduleStatistics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                      <p className="text-3xl font-bold mt-2">{moduleStatistics.totalConversations}</p>
                    </div>
                    <MessageSquare className="h-12 w-12 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Messages per Conversation</p>
                      <p className="text-3xl font-bold mt-2">{moduleStatistics.averageMessagesPerConversation}</p>
                    </div>
                    <BarChart3 className="h-12 w-12 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Students with Conversations</p>
                      <p className="text-3xl font-bold mt-2">{moduleStatistics.studentsWithConversations}</p>
                    </div>
                    <Users className="h-12 w-12 text-primary opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <CircularProgressbarWithChildren
                      value={stats.lead}
                      background
                      styles={buildStyles({
                        strokeLinecap: "round",
                        pathColor: "#ffd200",
                        textColor: "#000",
                        trailColor: "#d6d6d6",
                        backgroundColor: "#d6d6d6",
                        textSize: 8,
                        pathTransitionDuration: 0.15,
                      })}
                    >
                      <div className="text-lg font-bold">{`${stats.lead}%`}</div>
                      <div className="text-sm text-muted-foreground">{`Lead`}</div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <CircularProgressbarWithChildren
                      value={stats.position}
                      background
                      styles={buildStyles({
                        strokeLinecap: "round",
                        pathColor: "#0064a4",
                        textColor: "#000",
                        trailColor: "#d6d6d6",
                        backgroundColor: "#d6d6d6",
                        textSize: 8,
                        pathTransitionDuration: 0.15,
                      })}
                    >
                      <div className="text-lg font-bold">{`${stats.position}%`}</div>
                      <div className="text-sm text-muted-foreground">{`Position`}</div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <CircularProgressbarWithChildren
                      value={stats.claim}
                      background
                      styles={buildStyles({
                        strokeLinecap: "round",
                        pathColor: "#6aa2b8",
                        textColor: "#000",
                        trailColor: "#d6d6d6",
                        backgroundColor: "#d6d6d6",
                        textSize: 8,
                        pathTransitionDuration: 0.15,
                      })}
                    >
                      <div className="text-lg font-bold">{`${stats.claim}%`}</div>
                      <div className="text-sm text-muted-foreground">{`Claim`}</div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <CircularProgressbarWithChildren
                      value={stats.counterClaim}
                      background
                      styles={buildStyles({
                        strokeLinecap: "round",
                        pathColor: "#f78d2d",
                        textColor: "#000",
                        trailColor: "#d6d6d6",
                        backgroundColor: "#d6d6d6",
                        textSize: 8,
                        pathTransitionDuration: 0.15,
                      })}
                    >
                      <div className="text-lg font-bold">{`${stats.counterClaim}%`}</div>
                      <div className="text-sm text-muted-foreground">{`Counterclaim`}</div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <CircularProgressbarWithChildren
                      value={stats.rebuttal}
                      background
                      styles={buildStyles({
                        strokeLinecap: "round",
                        pathColor: "#934D6D",
                        textColor: "#000",
                        trailColor: "#d6d6d6",
                        backgroundColor: "#d6d6d6",
                        textSize: 8,
                        pathTransitionDuration: 0.15,
                      })}
                    >
                      <div className="text-lg font-bold">{`${stats.rebuttal}%`}</div>
                      <div className="text-sm text-muted-foreground">{`Rebuttal`}</div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <CircularProgressbarWithChildren
                      value={stats.evidence}
                      background
                      styles={buildStyles({
                        strokeLinecap: "round",
                        pathColor: "#8D91C7",
                        textColor: "#000",
                        trailColor: "#d6d6d6",
                        backgroundColor: "#d6d6d6",
                        textSize: 8,
                        pathTransitionDuration: 0.15,
                      })}
                    >
                      <div className="text-lg font-bold">{`${stats.evidence}%`}</div>
                      <div className="text-sm text-muted-foreground">{`Evidence`}</div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32">
                    <CircularProgressbarWithChildren
                      value={stats.conclude}
                      background
                      styles={buildStyles({
                        strokeLinecap: "round",
                        pathColor: "#7ab800",
                        textColor: "#000",
                        trailColor: "#d6d6d6",
                        backgroundColor: "#d6d6d6",
                        textSize: 8,
                        pathTransitionDuration: 0.15,
                      })}
                    >
                      <div className="text-lg font-bold">{`${stats.conclude}%`}</div>
                      <div className="text-sm text-muted-foreground">{`Concluding Summary`}</div>
                    </CircularProgressbarWithChildren>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="border-t border-border"></div>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <h3 className="text-lg font-semibold">Student Reports</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={rowsPerPage.toString()} onValueChange={handleChangeRowsPerPage}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {moduleData?.raterEnabled ? (
                      <TableRow>
                        {columns.map((column) => (
                          <TableHead
                            key={column.id}
                            className={column.align === "right" ? "text-right" : ""}
                            style={{ minWidth: column.minWidth }}
                          >
                            {column.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableHead style={{ minWidth: 170 }}>Name</TableHead>
                        <TableHead style={{ minWidth: 100 }}>Has Conversations</TableHead>
                        <TableHead style={{ minWidth: 150 }}># of Conversations</TableHead>
                        <TableHead style={{ minWidth: 150 }}>Actions</TableHead>
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.length === 0 && studentConversationData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={moduleData?.raterEnabled ? columns.length : 4} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            {isLoading ? (
                              <>
                                <Loader2 className="h-8 w-8 text-muted-foreground opacity-50 animate-spin" />
                                <p className="text-muted-foreground">Loading data...</p>
                              </>
                            ) : (
                              <>
                                <BarChart3 className="h-8 w-8 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No data available</p>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : moduleData?.raterEnabled ? (
                      paginatedRows.map((row) => {
                        return (
                          <TableRow
                            key={row.name}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              navigator(`/courses/${courseData?.id}/modules/${moduleData?.id}/username/${row.username}`)
                            }
                          >
                            {columns.map((column) => {
                              const value = row[column.id];
                              return (
                                <TableCell key={column.id} className={column.align === "right" ? "text-right" : ""}>
                                  {typeof value === "boolean" ? (
                                    value ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <X className="h-5 w-5 text-destructive" />
                                    )
                                  ) : (
                                    <button
                                      className="hover:text-primary transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator(
                                          `/courses/${courseData?.id}/modules/${moduleData?.id}/username/${row.username}`,
                                        );
                                      }}
                                    >
                                      {value}
                                    </button>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })
                    ) : studentConversationData.length > 0 ? (
                      studentConversationData
                        .slice(startIndex, Math.min(endIndex, studentConversationData.length))
                        .map((student) => {
                          return (
                            <TableRow key={student.username} className="hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {student.name} {student.family_name}
                              </TableCell>
                              <TableCell>
                                {student.hasConversations ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <X className="h-5 w-5 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell>{student.numConversations}</TableCell>
                              <TableCell>
                                {student.numConversations > 0 ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      navigator(
                                        `/courses/${courseData?.id}/modules/${moduleData?.id}/username/${student.username}`,
                                      )
                                    }
                                  >
                                    View Conversations
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No conversations</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      paginatedRows.map((row) => {
                        const student = studentConversationData.find((s) => s.username === row.username);
                        return (
                          <TableRow key={row.name} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>
                              {student?.hasConversations ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <X className="h-5 w-5 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell>{row.convos}</TableCell>
                            <TableCell>
                              {row.convos > 0 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    navigator(
                                      `/courses/${courseData?.id}/modules/${moduleData?.id}/username/${row.username}`,
                                    )
                                  }
                                >
                                  View Conversations
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">No conversations</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {(rows.length > 0 || studentConversationData.length > 0) && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, moduleData?.raterEnabled ? rows.length : studentConversationData.length)} of{" "}
                    {moduleData?.raterEnabled ? rows.length : studentConversationData.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangePage(page - 1)}
                      disabled={page === 0}
                      aria-label="Previous page" //TODO
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangePage(page + 1)}
                      disabled={page >= totalPages - 1}
                      aria-label="Next page" //TODO
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  ) : (
    <PageLoader pageName="Module Reports" />
  );
}
