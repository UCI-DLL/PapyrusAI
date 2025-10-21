/**
 * ModuleReports.tsx, component for displaying reports for a specific module
 */

import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import LinearProgress from "@mui/material/LinearProgress";
import {
  buildStyles,
  CircularProgressbarWithChildren,
} from "react-circular-progressbar";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import {
  getCourse,
  getRaterModuleData,
  getUsersInCourse,
} from "../../utility/endpoints/CourseEndpoints";
import { CustomUserType } from "../../utility/types/UserTypes";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import { getUserConversationList } from "../../utility/endpoints/ConversationEndpoints";

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
  username: string
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
  const [userList, setUserList] = useState<
    Array<CustomUserType & { numConvos: number }>
  >([]);
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

  useEffect(() => {
    const controller = new AbortController();
    if (user) {
      setIsLoading(true);
      if (
        location.pathname &&
        location.pathname.split("/") &&
        location.pathname.split("/")[1] &&
        location.pathname.split("/")[2] &&
        location.pathname.split("/")[3]
      ) {
        const courseId = location.pathname.split("/")[2];
        const moduleId = location.pathname.split("/")[3];

        //Get user list
        if (userList.length === 0) {
          getUsersInCourseList(courseId, moduleId, controller.signal);
        }

        //Get course and module data
        Get(getCourse(courseId), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data.modules) {
              setCourseData(res.data);
              const module = res.data.modules.find(
                (mod: ModuleType) => mod.id === moduleId
              );
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
        Get(getRaterModuleData(courseId, moduleId), controller.signal).then(
          (res) => {
            if (res && res.status && res.status < 300) {
              if (res.data) {
                //Get rater data for the module
                res.data.forEach((item: any) => {
                  //convert the rater info to 2d array
                  const rater = item.content
                    .split("\n")
                    .map((row: string) => row.split(","));
                  setRaterData((prev) => [
                    ...prev,
                    { ...item, content: rater },
                  ]);
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
          }
        );
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
          user.username
        );
        setRows((prev) => {
          const newArray = [...prev];
          if (newArray.some((p) => p.username === row.username)) {
            //if user is in the list already, just update it
            const index = newArray.findIndex(
              (p) => p.username === row.username
            );
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
          user.username
        );
        setRows((prev) => {
          const newArray = [...prev];
          if (newArray.some((p) => p.username === row.username)) {
            //if user is in the list already, just update it
            const index = newArray.findIndex(
              (p) => p.username === row.username
            );
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
        counterClaim: Math.round(
          getAverageOfDiscourseType(raterData, "3") * 100
        ),
        rebuttal: Math.round(getAverageOfDiscourseType(raterData, "4") * 100),
        evidence: Math.round(getAverageOfDiscourseType(raterData, "5") * 100),
        conclude: Math.round(getAverageOfDiscourseType(raterData, "6") * 100),
      });
    }
  }, [raterData]);

  function getAverageOfDiscourseType(
    raterArray: Array<RaterDataType>,
    type: string
  ) {
    let totalCount = 0;
    let arrayLength = raterArray.length;

    //this calculates how many essays have a discourse type of all essays
    raterArray.forEach((item) => {
      let leadEntries = item.content.filter((e) => e[4] === type);
      totalCount += leadEntries.length > 0 ? 1 : 0;
    });
    return totalCount > 0 ? totalCount / arrayLength : 0;
  }

  function getUsersInCourseList(
    course: string,
    module: string,
    signal: AbortSignal,
    nextToken?: string
  ) {
    var limit = 25;
    Get(getUsersInCourse(course, limit, nextToken), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.users) {
          //filter out current user and email_verified
          res.data.users.map(async (u: CustomUserType) => {
            await Get(getUserConversationList(u.username), signal).then(
              (res) => {
                if (res && res.status && res.status < 300) {
                  if (res.data) {
                    //Get the list of all conversations
                    //for the specific courseid and moduleid, get the number of conversations for the user
                    const temp = res.data.find(
                      (con: any) =>
                        con.courseId === course && con.moduleId === module
                    );
                    const tempObj = {
                      name: u.name,
                      family_name: u.family_name,
                      email: u.email,
                      sub: u.sub,
                      username: u.username,
                      numConvos:
                        temp && temp.conversations
                          ? temp.conversations.length
                          : 0,
                    };
                    setUserList((prev) => [...prev, tempObj]);
                  }
                } else if (res && res.status === 401) {
                  navigator("/login");
                } else {
                  // handle error
                }
              }
            );
          });

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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return !isLoading ? (
    <div className="reports">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <h3>
            {courseData?.name} - {moduleData?.name}
          </h3>
          <div>
            On this page, you can view the overall usage within this module. If
            you wish to view a specific user’s activity, click on their name to
            access their conversations.
          </div>
          {stats ? (
            <>
              <hr />
              <div className="reports__progressbar_row">
                <div className="reports__progressbar_item">
                  <CircularProgressbarWithChildren
                    value={stats.lead}
                    background
                    styles={buildStyles({
                      strokeLinecap: "round",
                      pathColor: "#ffd200",
                      textColor: "#000",
                      trailColor: "#d6d6d6", //white
                      backgroundColor: "#d6d6d6",
                      textSize: 8,
                      pathTransitionDuration: 0.15,
                    })}
                  >
                    <div className="reports__progressbar_text">{`${stats.lead}%`}</div>
                    <div className="reports__progressbar_text">{`Lead`}</div>
                  </CircularProgressbarWithChildren>
                </div>

                <div className="reports__progressbar_item">
                  <CircularProgressbarWithChildren
                    value={stats.position}
                    background
                    styles={buildStyles({
                      strokeLinecap: "round",
                      pathColor: "#0064a4",
                      textColor: "#000",
                      trailColor: "#d6d6d6", //white
                      backgroundColor: "#d6d6d6",
                      textSize: 8,
                      pathTransitionDuration: 0.15,
                    })}
                  >
                    <div className="reports__progressbar_text">{`${stats.position}%`}</div>
                    <div className="reports__progressbar_text">{`Position`}</div>
                  </CircularProgressbarWithChildren>
                </div>
                <div className="reports__progressbar_item">
                  <CircularProgressbarWithChildren
                    value={stats.claim}
                    background
                    styles={buildStyles({
                      strokeLinecap: "round",
                      pathColor: "#6aa2b8",
                      textColor: "#000",
                      trailColor: "#d6d6d6", //white
                      backgroundColor: "#d6d6d6",
                      textSize: 8,
                      pathTransitionDuration: 0.15,
                    })}
                  >
                    <div className="reports__progressbar_text">{`${stats.claim}%`}</div>
                    <div className="reports__progressbar_text">{`Claim`}</div>
                  </CircularProgressbarWithChildren>
                </div>
                <div className="reports__progressbar_item">
                  <CircularProgressbarWithChildren
                    value={stats.counterClaim}
                    background
                    styles={buildStyles({
                      strokeLinecap: "round",
                      pathColor: "#f78d2d",
                      textColor: "#000",
                      trailColor: "#d6d6d6", //white
                      backgroundColor: "#d6d6d6",
                      textSize: 8,
                      pathTransitionDuration: 0.15,
                    })}
                  >
                    <div className="reports__progressbar_text">{`${stats.counterClaim}%`}</div>
                    <div className="reports__progressbar_text">{`Counterclaim`}</div>
                  </CircularProgressbarWithChildren>
                </div>
              </div>
              <div className="reports__progressbar_row">
                <div className="reports__progressbar_item">
                  <CircularProgressbarWithChildren
                    value={stats.rebuttal}
                    background
                    styles={buildStyles({
                      strokeLinecap: "round",
                      pathColor: "#934D6D",
                      textColor: "#000",
                      trailColor: "#d6d6d6", //white
                      backgroundColor: "#d6d6d6",
                      textSize: 8,
                      pathTransitionDuration: 0.15,
                    })}
                  >
                    <div className="reports__progressbar_text">{`${stats.rebuttal}%`}</div>
                    <div className="reports__progressbar_text">{`Rebuttal`}</div>
                  </CircularProgressbarWithChildren>
                </div>

                <div className="reports__progressbar_item">
                  <CircularProgressbarWithChildren
                    value={stats.evidence}
                    background
                    styles={buildStyles({
                      strokeLinecap: "round",
                      pathColor: "#8D91C7",
                      textColor: "#000",
                      trailColor: "#d6d6d6", //white
                      backgroundColor: "#d6d6d6",
                      textSize: 8,
                      pathTransitionDuration: 0.15,
                    })}
                  >
                    <div className="reports__progressbar_text">{`${stats.evidence}%`}</div>
                    <div className="reports__progressbar_text">{`Evidence`}</div>
                  </CircularProgressbarWithChildren>
                </div>
                <div className="reports__progressbar_item">
                  <CircularProgressbarWithChildren
                    value={stats.conclude}
                    background
                    styles={buildStyles({
                      strokeLinecap: "round",
                      pathColor: "#7ab800",
                      textColor: "#000",
                      trailColor: "#d6d6d6", //white
                      backgroundColor: "#d6d6d6",
                      textSize: 8,
                      pathTransitionDuration: 0.15,
                    })}
                  >
                    <div className="reports__progressbar_text">{`${stats.conclude}%`}</div>
                    <div className="reports__progressbar_text">{`Concluding Summary`}</div>
                  </CircularProgressbarWithChildren>
                </div>
              </div>
            </>
          ) : (
            <></>
          )}

          <hr />

          <Paper sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 440, border: "1px solid black" }}>
              <Table stickyHeader aria-label="rater table">
                <TableHead>
                  {moduleData?.raterEnabled ? (
                    <TableRow>
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          align={column.align}
                          style={{ minWidth: column.minWidth }}
                        >
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  ) : (
                    <TableRow style={{ width: "100%" }}>
                      <TableCell
                        key={"name"}
                        align={"left"}
                        style={{ minWidth: 170, width: "100%" }}
                      >
                        Name
                      </TableCell>
                      <TableCell
                        key={"convos"}
                        align={"left"}
                        style={{ minWidth: 170, width: "100%" }}
                      >
                        Num Convos
                      </TableCell>
                      <TableCell
                        key={"essay"}
                        align={"left"}
                        style={{ minWidth: 170, width: "100%" }}
                      >
                        Num Essays
                      </TableCell>
                    </TableRow>
                  )}
                </TableHead>
                {moduleData?.raterEnabled ? (
                  <TableBody>
                    {rows
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row) => {
                        return (
                          <TableRow
                            hover
                            role="button"
                            tabIndex={-1}
                            key={row.name}
                            onClick={() =>
                              navigator(
                                `/courses/${courseData?.id}/modules/${moduleData?.id}/username/${row.username}`
                              )
                            }
                          >
                            {columns.map((column) => {
                              const value = row[column.id];
                              return (
                                //add button on row to view user's conversations
                                <TableCell key={column.id} align={column.align}>
                                  {typeof value === "boolean" ? (
                                    value ? (
                                      <CheckCircleOutlineIcon color="success" />
                                    ) : (
                                      <HighlightOffIcon color="error" />
                                    )
                                  ) : (
                                    <button
                                      onClick={() =>
                                        navigator(
                                          `/courses/${courseData?.id}/modules/${moduleData?.id}/username/${row.username}`
                                        )
                                      }
                                    >
                                      {value}
                                    </button>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                  </TableBody>
                ) : (
                  <TableBody>
                    {rows
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row) => {
                        return (
                          <TableRow
                            hover
                            role="button"
                            tabIndex={-1}
                            key={row.name}
                            onClick={() =>
                              navigator(
                                `/courses/${courseData?.id}/modules/${moduleData?.id}/username/${row.username}`
                              )
                            }
                          >
                            {columns.map((column) => {
                              const value = row[column.id];
                              if (typeof value !== "boolean") {
                                return (
                                  //add button on row to view user's conversations
                                  <TableCell
                                    key={column.id}
                                    align={column.align}
                                  >
                                    <button
                                      onClick={() =>
                                        navigator(
                                          `/courses/${courseData?.id}/modules/${moduleData?.id}/username/${row.username}`
                                        )
                                      }
                                    >
                                      {value}
                                    </button>
                                  </TableCell>
                                );
                              } else {
                                return <></>;
                              }
                            })}
                          </TableRow>
                        );
                      })}
                  </TableBody>
                )}
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  );
}
