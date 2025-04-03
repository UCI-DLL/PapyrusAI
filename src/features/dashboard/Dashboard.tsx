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
import { AlertContext } from "../../utility/context/AlertContext";
import { orderCourseRecentlyCreated } from "../../utility/Helpers";


export default function Dashboard(): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [courseList, setCourseList] = useState<Array<CourseType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  //open the modal for a user to add a course
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
          setCourseList([]);
          setIsLoading(false);
          setAlert({ message: "Encountered an error. Please try again later.", type: "error" });
        }
      }
    });
  }

  function refreshList() {
    const controller = new AbortController();
    getCourses(controller.signal)
  }

  return !isLoading ? (
    <div className="dashboard">
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

      <div className="dashboard__section-header">
        <h3>My Courses</h3>
        <div>
          <Button onClick={() => navigator("/courses")}>View All Courses</Button>
          &nbsp;&nbsp;&nbsp;
          {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
            <Button variant="outlined" onClick={() => navigator("/createcourse")}>Create Course</Button>
          )}
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={() => setShowAddCourseModal(true)}>Join Course</Button>
        </div>
      </div>

      <hr />
      {courseList.length > 0 ? (
        <CourseList list={orderCourseRecentlyCreated(courseList).slice(0, 6)} refreshList={refreshList} />
      ) : <></>}

      &nbsp;&nbsp;&nbsp;

      <div className="dashboard__section-header">
        <h3>Recent Modules</h3>
        <div>
          <Button onClick={() => navigator("/modules")}>View All Modules</Button>
        </div>
      </div>
      <hr />
      {courseList.length > 0 && mostRecentModules(orderCourseRecentlyCreated(courseList)).map((course, index) => {
        return course.modules.length > 0 ? (
          <div style={{ width: "100%" }} key={index}>
            <ModuleList course={({ ...course, modules: course.mostRecentItem ? [course.mostRecentItem] : [] })} refreshList={refreshList} />
            <Divider />
          </div>
        ) : null
      })}
    </div>
  ) : (
    <LinearProgress />
  )
}

//get the most recently created module within each course to display on dashboard
function mostRecentModules(courses: Array<CourseType>) {
  // Get the most recently created object in each subarray
  const categoriesWithRecentItems = courses.map(course => {
    const mostRecentItem = course.modules.length > 0
      ? course.modules.reduce((latest, item) =>
        item.id > latest.id ? item : latest
      )
      : null; // Handle empty items array

    return { ...course, mostRecentItem };
  });
  return categoriesWithRecentItems
}