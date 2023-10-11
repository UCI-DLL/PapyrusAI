// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router";
// import { Button } from "@mui/material";
// import { CourseType } from "../../utility/types/CourseTypes";
// import Get from "../../utility/Get";
// import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import LinearProgress from '@mui/material/LinearProgress';

export default function ConversationList(): JSX.Element {
  // let location = useLocation();
  // let navigator = useNavigate();
  // const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  // const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [error, setError] = useState<string>();

  // useEffect(() => {
  //   const controller = new AbortController();
  //   setIsLoading(true);
    //TODO get conversation list based on course and module
    // Get(getCourseList(), controller.signal).then(res => {
    //   if (res.status && res.status < 300) {
    //     if (res.data) {
    //       //update our version of user
    //       setCourseList(res.data);
    //     }
    //   } else if (res.status === 401) {
    //     navigator("/login");
    //   } else {
    //     // handle error
    //     setError("No Courses Found");
    //   }
    //   setIsLoading(false);
    // });
    // eslint-disable-next-line
  // }, []);


  // return !isLoading ? (
  //   <div className="courses">
  //     {error ? (
  //       <div>{error}</div>
  //     ) : (
  //       <>
  //         <div className="courses__section-header">
  //           <h3>My Conversations</h3>
  //           <Button variant="contained" onClick={() => navigator("/createcourse")}>Create Course</Button>
  //         </div>
  //         <hr />
  //       </>
  //     )}
  //   </div>
  // ) : 
  return (
    <LinearProgress />
  )
}