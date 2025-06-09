import React, { useContext, useState } from "react";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import {
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { UserContext } from "../utility/context/UserContext";
import { AlertContext } from "../utility/context/AlertContext";
import { CourseType } from "../utility/types/CourseTypes";
import Post from "../utility/Post";
import { postCopyCourse } from "../utility/endpoints/CourseEndpoints";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";


interface CourseListProps {
  course: CourseType;
  refreshList: () => void;
  keyy: number | string;
  onClick?: (courseId: string) => void;
}

export default function CourseCard({ course, refreshList, keyy, onClick }: CourseListProps): JSX.Element {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openDuplicateModal, setOpenDuplicateModal] = useState<string>("");
  const [duplicateCourseData, setDuplicateCourseData] = useState<{
    name: string,
    signUpCode: string,
    isActive: boolean
  }>({
    name: "",
    signUpCode: "",
    isActive: false
  });
  const [menuAnchorEl, setAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAddAnchorEl(null);
  };

  function editCourse(courseId: string) {
    navigator(`/editcourse/${courseId}`)
  }

  function duplicateCourse(courseId: string) {
    handleMenuClose();
    setOpenDuplicateModal(courseId)
  }

  function handleDuplicateCourse() {
    setIsLoading(true);
    Post(postCopyCourse(openDuplicateModal), duplicateCourseData).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of Duplicated
          setOpenDuplicateModal("");
          setAlert({ message: "Course Duplicated", type: "success" })
          setDuplicateCourseData({
            name: "",
            signUpCode: "",
            isActive: false
          })
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" })
      }
      refreshList();
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDuplicateCourseData({ ...duplicateCourseData, [e.target.name]: e.target.value });
  }

  const ownerMenu = ["Edit Course", "Duplicate"]
  const ownerMenuFunctions = [editCourse, duplicateCourse]
  const nonOwnerMenu = ["Duplicate"]
  const nonOwnerMenuFunctions = [duplicateCourse]

  return course && user ? (
    <div className="courses__list">
      <Modal
        isOpen={openDuplicateModal !== ""}
        title={"Duplicate Course"}
        onRequestClose={() => setOpenDuplicateModal("")}
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                handleDuplicateCourse()
              }}
            >
              Duplicate
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenDuplicateModal("")}>
              Close
            </Button>
          </>
        }
      >
        <div>
          <div>Enter a name and a unique sign up code for the duplicated course. Duplicating a course will also copy over all the modules and settings within this course.</div>
          <div>If you wish to publish (i.e., make visible to students) the new course immediately, check the “Publish Course” button.</div>
          <TextField
            name="name"
            label="New Course Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={duplicateCourseData.name}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <TextField
            name="signUpCode"
            label="New Course Sign Up Code"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={duplicateCourseData.signUpCode}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <Checkbox
            onClick={() => {
              setDuplicateCourseData((prev) => ({
                ...prev,
                isActive: !duplicateCourseData.isActive
              }))
            }}
            checked={duplicateCourseData.isActive}
            isDisabled={isLoading}
          >
            <span>
              Publish Course
            </span>
          </Checkbox>
          &nbsp;
        </div>
      </Modal>

      <Menu
        id={`${keyy}${user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ? "admin" : "instructor"}-menu`}
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'course-menu-button',
        }}
      >
        {
          user?.groups.includes(course.id) && (
            user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ||
            user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
            user?.groups.includes(course.id + "-TA") //handle tas
          ) && (
            course.instructor.username === user.username ? (
              ownerMenu.map((item: string, index: number) => {
                return (
                  <MenuItem key={index} onClick={(e: any) => {
                    ownerMenuFunctions[index](course.id)
                  }}>
                    {item}
                  </MenuItem>
                )
              })
            ) : (
              nonOwnerMenu.map((item: string, index: number) => {
                return (
                  <MenuItem key={index} onClick={(e: any) => {
                    nonOwnerMenuFunctions[index](course.id)
                  }}>
                    {item}
                  </MenuItem>
                )
              })
            )
          )
        }
      </Menu>
      <Card>
        <CardHeader
          action={ //if user in course and has more permissions than a normal user
            user.groups.includes(course.id) && (!onClick) && (
              user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmins") ||
              user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ||
              user?.groups.includes(course.id + "-TA") //handle tas
            ) && (
              <Tooltip title={"Course Options"}>
                <IconButton
                  className="courses__button__menu-btn"
                  aria-label="course menu"
                  id={`${keyy}${user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ? "admin" : "instructor"}-button`}
                  aria-controls={menuOpen ? `${keyy}${user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ? "admin" : "instructor"}-menu` : ""}
                  aria-haspopup="true"
                  aria-expanded={menuOpen ? 'true' : undefined}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    handleMenuClick(e)
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )
          }
          title={course.name}
          subheader={
            <>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                {course.section ?
                  `${course.term ? course.term : ""} ${course.year ? course.year : ""} - ${course.section}` :
                  `${course.term ? course.term : ""} ${course.year ? course.year : ""}`}
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" >
                {`Instructor: ${course.instructor.name} ${course.instructor.family_name}`}
              </Typography>
            </>
          }
        />
        <CardActions sx={{ justifyContent: "space-between" }}>
          {onClick ? (
            <Button
              size="small"
              variant="contained"
              onClick={() => onClick(course.id)}
              style={{ width: "100%" }}
            >
              Select
            </Button>
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={() => navigator(`/courses/${course.id}/modules`)}
              style={{ width: "100%" }}
            >
              Modules
            </Button>
          )}

        </CardActions>
      </Card>

    </div>
  ) : (
    <div>No available courses</div>
  )
}