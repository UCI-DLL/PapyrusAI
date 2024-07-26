import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { Button } from "@mui/material";
import CourseList from "./CourseList";
import { CourseType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import LinearProgress from '@mui/material/LinearProgress';
import { UserContext } from "../../utility/context/UserContext";
import { Modal } from "../../components/Modal";
import AddCourseForm from "./AddCourseForm";


export default function Courses(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddCourseModal) {
      getCourses(controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [showAddCourseModal]);

  function getCourses(signal: AbortSignal) {
    setIsLoading(true);
    Get(getCourseList(), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //get the list of all courses for this user
          setCourseList(res.data);
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setError("No Courses Found");
          setIsLoading(false);
        }
      }
    });
  }

  function refreshList() {
    const controller = new AbortController();
    getCourses(controller.signal)
  }

  return !isLoading ? (
    <div className="courses">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="courses__section-header">
            <Modal
              isOpen={showAddCourseModal}
              title={"Join course by sign up code"}
              onRequestClose={() => setShowAddCourseModal(false)}
              actions={
                <Button sx={{ width: "100%" }} variant="contained" color="secondary" onClick={() => setShowAddCourseModal(false)}>
                  Cancel
                </Button>
              }
            >
              <AddCourseForm
                closeForm={() => {
                  //then close modal
                  setShowAddCourseModal(false);
                }}
              />
            </Modal>
            <h3>My Courses</h3>
            <div>
              {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
                <Button variant="outlined" onClick={() => navigator("/createcourse")}>Create Course</Button>
              )}
              &nbsp;&nbsp;&nbsp;
              <Button variant="contained" onClick={() => setShowAddCourseModal(true)}>Join Course</Button>
            </div>

          </div>
          <hr />
          <CourseList list={courseList} refreshList={refreshList} />
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}