import React, { useEffect, useState, useContext } from "react";
import CourseList from "../course-groups/CourseList";
import ModuleList from "../modules/ModuleList";
import { Button, Divider } from "@mui/material";
import { useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getCourseList } from "../../utility/endpoints/CourseEndpoints";
import { CourseType } from "../../utility/types/CourseTypes";
import LinearProgress from '@mui/material/LinearProgress';
import { UserContext } from "../../utility/context/UserContext";
import AddCourseForm from "../course-groups/AddCourseForm";
import { Modal } from "../../components/Modal";


export default function Dashboard(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  //open the modal for a user to add a course
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddCourseModal) {
      setIsLoading(true);
      Get(getCourseList(), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //get the list of all courses for this user
            setCourseList(res.data);
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setCourseList([])
        }
        setIsLoading(false);
      });
    }

    // eslint-disable-next-line
  }, [showAddCourseModal]);

  return !isLoading ? (
    <div className="dashboard">
      <Modal
        isOpen={showAddCourseModal}
        title={"Add course by sign up code"}
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

      <div className="dashboard__section-header">
        <h3>My Courses</h3>
        <div>
          <Button onClick={() => navigator("/createcourse")}>View All Courses</Button>
          &nbsp;&nbsp;&nbsp;
          {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
            <Button variant="outlined" onClick={() => navigator("/createcourse")}>Create Course</Button>
          )}
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={() => setShowAddCourseModal(true)}>Add Course</Button>
        </div>
      </div>

      <hr />
      <CourseList list={courseList.slice(0, 6)} />

      &nbsp;&nbsp;&nbsp;

      <div className="dashboard__section-header">
        <h3>Available Modules</h3>
        <div>
          <Button onClick={() => navigator("/modules")}>View All Modules</Button>
        </div>
      </div>
      <hr />
      {courseList.map((course, index) => {
        return course.modules.length > 0 ? (
          <div style={{ width: "100%" }} key={index}>
            <ModuleList course={course} />
            <Divider />
          </div>
        ) : (
          <></>
        )
      })}

    </div>
  ) : (
    <LinearProgress />
  )
}