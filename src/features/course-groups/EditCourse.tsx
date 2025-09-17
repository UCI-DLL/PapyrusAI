import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Trash2, ChevronDown, Info, Loader2, Users, CheckCircle, XCircle, X } from "lucide-react";
import Get from "../../utility/Get";
import { getCourse, putUpdateCourse } from "../../utility/endpoints/CourseEndpoints";
import Put from "../../utility/Put";
import { CourseType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { CustomUserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { getUserList } from "../../utility/endpoints/UserEndpoints";

type EditCourseType = {
  name: string,
  signUpCode: string,
  isDeleted: boolean,
  isActive: boolean,
  year: string,
  section: string,
  term: string,
  taList: any,
}

const options = ['Save & Publish', 'Save without Publishing', 'Discard Changes'];

export default function EditCourse(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditCourseType>({
    name: "",
    signUpCode: "",
    isDeleted: false, //prev from backend
    isActive: false, //prev from backend
    year: "",
    section: "",
    term: "",
    taList: [],
  });
  const [prevSession, setPrevSession] = useState<CourseType | undefined>();
  const [errors, setErrors] = useState<EditCourseType>({
    name: "",
    signUpCode: "",
    isDeleted: false,
    isActive: false,
    year: "",
    section: "",
    term: "",
    taList: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const { setAlert } = useContext(AlertContext);
  const [userList, setUserList] = useState<Array<CustomUserType>>([]);
  const { user } = useContext(UserContext);
  const [openSave, setOpenSave] = useState(false);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openActiveModal, setOpenActiveModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();

    if (userList.length === 0) {
      getUsers("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing 
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "editcourse" &&
      location.pathname.split("/")[2]
    ) {
      //get prev course data
      const courseId = location.pathname.split("/")[2];
      Get(getCourse(courseId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //set prev course data
            setPrevSession(res.data);
            //also set session
            setSession({
              name: res.data.name,
              signUpCode: res.data.signUpCode,
              isDeleted: res.data.isDeleted,
              isActive: res.data.isActive,
              year: res.data.year ? res.data.year : "",
              term: res.data.term ? res.data.term : "",
              section: res.data.section ? res.data.section : "",
              taList: res.data.taList ? res.data.taList : [],
            });
            setIsLoading(false);
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
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function handleClick(e: any) {
    if (selectedIndexSave === 0) { //Save and publish
      handleSubmit(e, true, false);
    } else if (selectedIndexSave === 1) { //save and not publish
      if (session.isActive) { //handle case that course is already active and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (selectedIndexSave === 2) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and publish
      handleSubmit(e, true, false);
    } else if (index === 1) { //save and not publish
      if (session.isActive) { //handle case that course is already active and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (index === 2) { //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSave(false);
  };


  function getUsers(PaginationToken: string, signal: AbortSignal) {
    var limit = 50;

    Get(getUserList(limit, PaginationToken), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data["Users"]) {
          //filter out current user and email_verified 
          var tempUserList = res.data["Users"].map((u: CustomUserType) => {
            return {
              name: u.name,
              family_name: u.family_name,
              email: u.email,
              sub: u.sub,
              username: u.username
            }
          });
          if (user) {
            tempUserList = tempUserList.filter((x: CustomUserType) => x.username !== user.username);
          }
          setUserList((prev) => [...prev, ...tempUserList]);

          //handle pages
          //note: PaginationToken will also come back as "undefined" if there are no more pages
          if (res.data["Users"].length >= limit && res.data["PaginationToken"]) {
            getUsers(res.data["PaginationToken"], signal);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
        }
      }
    });
  }


  function handleSubmit(e: any, isActive = false, isDeleted = false) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Name missing" }))
    }
    else if (session.signUpCode === "") {
      setErrors((prev) => ({ ...prev, signUpCode: "Sign up code missing" }))
    } else {
      //Update course
      if (prevSession) {
        // set is loading
        setIsLoading(true);
        //dont send signupcode if it didnt change
        if (prevSession.signUpCode === session.signUpCode) {
          const dataToSend = {
            name: session.name,
            isActive: isActive,
            isDeleted: isDeleted,
            year: session.year,
            section: session.section,
            term: session.term,
            taList: session.taList,
          }
          // post data back
          Put(putUpdateCourse(prevSession.id), dataToSend).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //pop up notifying user of creation
                setAlert({ message: "Course Updated", type: "success" })
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              // set errors
              setAlert({ message: res.data, type: "error" })
            }
            // set is loading back 
            setIsLoading(false);
          });
        } else {
          // post data back
          Put(putUpdateCourse(prevSession.id), session).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data) {
                //redirect to course list
                navigator("/courses");
                //pop up notifying user of creation
                setAlert({ message: "Course Updated", type: "success" })
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              // set errors
              setAlert({ message: res.data, type: "error" })
            }
            // set is loading back 
            setIsLoading(false);
          });
        }

      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }


  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <Dialog open={showSavePublishTooltip} onOpenChange={setShowSavePublishTooltip}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>What is Save & Publish?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              To save and publish (i.e., make visible to students) your course, select "Save & Publish".
              If you want to save your course without publishing the course, select "Save without Publishing".
            </p>
            <p className="italic text-muted-foreground">
              Note: Choosing this option after the course has already been published will unpublish the course.
            </p>
          </div>
          <DialogFooter>
            <Button variant="default" onClick={() => setShowSavePublishTooltip(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Course?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you would like to permanently delete this course?</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={(e) => handleSubmit(e, false, true)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openDiscardModal} onOpenChange={setOpenDiscardModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you would like to discard the changes to this course?</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpenDiscardModal(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => navigator(-1)}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openActiveModal} onOpenChange={setOpenActiveModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Unpublish Course?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>This course is current published and available to the public. Continuing will make the course unavailable to students.</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setOpenActiveModal(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={(e) => handleSubmit(e, false, false)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!error && prevSession ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Edit {prevSession.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSavePublishTooltip(true)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>What is Save & Publish?</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenDeleteModal(true)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Course</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu open={openSave} onOpenChange={setOpenSave}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" className="flex items-center gap-2">
                        {options[selectedIndexSave]}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {options.map((option, index) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={(event) => handleMenuItemClick(event, index)}
                          className={index === 2 ? "text-muted-foreground" : ""}
                        >
                          {option}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Courses are spaces in which instructors can create and organize modules that customize how students can interact with the AI.
              For more information on editing a course, please see the{" "}
              <a
                href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.1pkdik3iscqd"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:no-underline"
              >
                "Editing a Course" section of our instructor guide
              </a>
              .
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  * indicates a required field
                </div>
                <div className="flex items-center gap-2">
                  {session.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Published
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-500" />
                      <Badge variant="secondary">
                        Unpublished
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={(e) => handleSubmit(e, true, false)} className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Enter Course Information</Label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course-name" className="text-sm font-medium">
                      Course Name *
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The name for your course that users will see upon joining.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="course-name"
                    name="name"
                    placeholder="Eng190W Communications in the Professional World"
                    value={session.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={errors.name !== "" ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="signup-code" className="text-sm font-medium">
                      Course Sign Up Code *
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The unique sign up code that users will use to join your course. You can use any combination of letters and numbers. This is case sensitive.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="signup-code"
                    name="signUpCode"
                    placeholder="FALLCSE100ISCOOL"
                    value={session.signUpCode}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={errors.signUpCode !== "" ? "border-destructive" : ""}
                  />
                  {errors.signUpCode && (
                    <p className="text-sm text-destructive">{errors.signUpCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course-year" className="text-sm font-medium">
                      Year
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The year in which your course is taking place.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="course-year"
                    name="year"
                    type="number"
                    placeholder="2023"
                    value={session.year}
                    onChange={handleChange}
                    disabled={isLoading}
                    min="0"
                    className={errors.year !== "" ? "border-destructive" : ""}
                  />
                  {errors.year && (
                    <p className="text-sm text-destructive">{errors.year}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course-term" className="text-sm font-medium">
                      Term
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The term in which your course is taking place.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={session.term}
                    onValueChange={(value) => setSession((prev) => ({ ...prev, term: value }))}
                    disabled={isLoading}
                  >
                    <SelectTrigger className={errors.term !== "" ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.term && (
                    <p className="text-sm text-destructive">{errors.term}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="course-section" className="text-sm font-medium">
                      Section / Period
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The section number or period for your course.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="course-section"
                    name="section"
                    placeholder="Section 02"
                    value={session.section}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={errors.section !== "" ? "border-destructive" : ""}
                  />
                  {errors.section && (
                    <p className="text-sm text-destructive">{errors.section}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Teaching Assistants</Label>
                  <div className="space-y-3">
                    {session.taList.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {session.taList.map((ta: CustomUserType, index: number) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                            <Users className="h-3 w-3" />
                            <span>{ta.name} {ta.family_name} - {ta.email}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => {
                                const newTaList = session.taList.filter((_: CustomUserType, i: number) => i !== index);
                                setSession(prev => ({ ...prev, taList: newTaList }));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Select
                      value=""
                      onValueChange={(value) => {
                        const selectedUser = userList.find(user => user.username === value);
                        if (selectedUser && !session.taList.find((ta: CustomUserType) => ta.username === selectedUser.username)) {
                          if (session.taList.length >= 10) {
                            setErrors((prev) => ({ ...prev, taList: "Max 10 Teaching Assistants" }));
                          } else {
                            setSession(prev => ({ ...prev, taList: [...prev.taList, selectedUser] }));
                            setErrors((prev) => ({ ...prev, taList: "" }));
                          }
                        }
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teaching assistant to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {userList
                          .filter(user => !session.taList.find((ta: CustomUserType) => ta.username === user.username))
                          .map((user) => (
                            <SelectItem key={user.username} value={user.username}>
                              {user.name} {user.family_name} - {user.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {errors.taList && (
                      <p className="text-sm text-destructive">{errors.taList}</p>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      The name and email address of the teaching assistant(s) assigned to your course. Teaching assistants can
                      create and edit modules for you, but not delete or unpublish the course. You can assign multiple people to this role.
                      <span className="italic"> In order to add someone as a teaching assistant, they must already have a PapyrusAI account.</span>
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <div
          className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
          role="status"
        >
          <XCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Course Not Found</p>
          <p className="text-sm">
            The course you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      )}
    </main>
  )
}