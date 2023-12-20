import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import LinearProgress from '@mui/material/LinearProgress';
import { CourseType } from "../../utility/types/CourseTypes";
import { Link } from "react-router-dom";
import { CustomUserType } from "../../utility/types/UserTypes";

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

  useEffect(() => {
    const controller = new AbortController();
    // for each course that the cuurent user is in, get the list of users
    if (user) {
      setIsLoading(true);
      user.groups.forEach((group) => {
        //skip instructor or student or researcher groups
        //remove TAs also
        if (
          group === "PapyrusAIStudents" || 
          group === "PapyrusAIInstructors" || 
          group === "PapyrusAIResearchers" ||
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
                  // setError("No Prompts Found");
                }
                setIsLoading(false);
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

    return (() => {
      setUserList([]);
      controller.abort();
    });

    // eslint-disable-next-line
  }, []);

  return !isLoading ? (
    <div className="reports">
      <h3>Reports</h3>
      <hr />

      {userList.map((x, index) => {
        return (
          <div style={{ width: "100%" }} key={index}>
            <h4>{x.course.name ? x.course.name : ""}</h4>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650, width: "100%" }} aria-label="user table" >
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell align="right">Family Name</TableCell>
                    <TableCell align="right">Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {x.users.map((row, i) => (
                    <TableRow
                      key={i}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        <Link to={`/reports/${row.sub}`} state={row} >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell align="right">{row.family_name}</TableCell>
                      <TableCell align="right">{row.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        )
      })}

    </div>
  ) : (
    <LinearProgress />
  )
}