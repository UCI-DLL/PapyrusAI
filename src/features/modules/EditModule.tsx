

import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormLabel,
  MenuItem,
  Tooltip,
  IconButton,
  LinearProgress,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Get from "../../utility/Get";
import { getModule, putUpdateModule } from "../../utility/endpoints/CourseEndpoints";
import Put from "../../utility/Put";
import { Checkbox } from "../../components/Checkbox";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import Markdown from "react-markdown";
import InfoIcon from '@mui/icons-material/Info';
import ListFolders from "../library/ListFolders";
import ListFolderContents from "../library/ListFolderContents";
import { FileType, PromptType } from "../../utility/types/CourseTypes";
import { Prompt } from "../../components/Prompt";
import { getOrgFile, getOrgPrompt, getUserFile, getUserPrompt } from "../../utility/endpoints/FolderEndpoints";
import { File } from "../../components/File";

type EditModuleType = {
  id: string,
  isDeleted: boolean,
  isPublished: boolean,
  isRepeating: boolean,
  isTemplate: boolean,
  moduleDescription: string,
  name: string,
  prompts: Array<PromptType>,
  files: Array<FileType>,
  showInitialPrompt: boolean,
  showWizard: boolean,
  raterEnabled: boolean,
}

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

const options = ['Save & Publish', 'Save without Publishing', 'Discard Changes'];

export default function EditModule(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditModuleType>({
    name: "",
    moduleDescription: "",
    isRepeating: false,
    isPublished: false,
    showInitialPrompt: true,
    prompts: [],
    files: [],
    showWizard: true,
    isDeleted: false, //prev
    isTemplate: false,
    id: "",
    raterEnabled: false
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    prompts: "",
    files: ""
  });
  const [moduleIds, setModuleIds] = useState<{
    courseId: string,
    moduleId: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [openSelectFolderModal, setOpenSelectFolderModal] = useState<boolean>(false);
  const [openSelectPromptModal, setOpenSelectPromptModal] = useState<{
    folderId: string,
    isOrgFolder: boolean,
  }>({ folderId: "", isOrgFolder: false });
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openActiveModal, setOpenActiveModal] = useState<boolean>(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState<{ id: string, type: string }>({
    id: "",
    type: "",
  });

  useEffect(() => {
    //When the page changes, reset the alert
    setAlert({ message: "", type: "info" });

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    //get pathname to figure out if we are editing 
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[4]
    ) {
      //get prev course data
      const courseId = location.pathname.split("/")[2];
      const moduleId = location.pathname.split("/")[4];
      //save the ids
      setModuleIds({ courseId: courseId, moduleId: moduleId });
      Get(getModule(courseId, moduleId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data.prompts) {
            // assign prompts to be prompt ids
            //also set session
            var tempSession = res.data;
            if (!tempSession.files) {
              tempSession.files = []
            }
            setSession(tempSession); //, prompts: res.data.prompts.map((p: PromptType) => p.id) 
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            navigator("/courses");
            setAlert({ message: "Module does not exist", type: "error" });
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

  function handleSaveClick(e: any) {
    if (selectedIndexSave === 0) { //Save and activate
      handleSubmit(e, true, false);
    } else if (selectedIndexSave === 1) { //save and not activate
      if (session.isPublished) { //handle case that module is already active and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (selectedIndexSave === 2) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and activate
      handleSubmit(e, true, false);
    } else if (index === 1) { //save and not activate
      if (session.isPublished) { //handle case that module is already active and they are switching it
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

  const handleToggle = () => {
    setOpenSave((prevOpen) => !prevOpen);
  };

  const handleSaveClose = (event: Event) => {
    if (
      anchorRefSave.current &&
      anchorRefSave.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenSave(false);
  };

  function handleSubmit(e: any, isPublished = false, isDeleted = false) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name missing" }))
    }
    else if (session.moduleDescription === "") {
      setErrors((prev: any) => ({ ...prev, moduleDescription: "Module description missing" }))
    } else {
      //Update course
      if (moduleIds) {
        // set is loading
        setIsLoading(true);
        const dataToSend = {
          name: session.name,
          moduleDescription: session.moduleDescription,
          isRepeating: session.isRepeating,
          isPublished: isPublished,
          showInitialPrompt: session.showInitialPrompt,
          prompts: session.prompts, //Send prompts with all information + folderId 
          files: session.files, //send files with all information + folderid
          showWizard: session.showWizard,
          isDeleted: isDeleted,
          isTemplate: session.isTemplate,
          id: session.id,
          raterEnabled: session.raterEnabled ? true : false,
        }
        // post data back
        Put(putUpdateModule(moduleIds.courseId, moduleIds.moduleId), dataToSend).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //redirect to course list
              navigator(`/courses/${moduleIds.courseId}/modules`);
              //pop up notifying user of creation
              setAlert({ message: "Module updated", type: "success" })
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // set errors
            setErrors({
              name: res.data,
              signUpCode: res.data,
              isDeleted: res.data,
              isPublished: res.data
            })
          }
          // set is loading back 
          setIsLoading(false);
        });

      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function selectFolder(folderId: string, isOrgFolder: boolean) {
    setOpenSelectPromptModal({
      folderId: folderId,
      isOrgFolder: isOrgFolder
    });
    setOpenSelectFolderModal(false);
  }

  function selectAsset(folderId: string, id: string, isOrgFolder: boolean, type: string) { //type is "prompt" or "file"
    setOpenSelectPromptModal({
      folderId: "",
      isOrgFolder: false
    });
    setIsLoading(true);
    const controller = new AbortController();

    //check if asset is prompt or file
    if (type === "prompt") {
      // get prompt and add it to list of prompts
      if (isOrgFolder) {
        Get(getOrgPrompt(folderId, id), controller.signal).then(res => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              if (session.prompts.filter(x => x.id === res.data.id).length === 0) {
                setSession(prev => ({ ...prev, prompts: [...prev.prompts, { ...res.data, isOrgFolder: true, folderId: folderId }] }))
              }
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "Prompt Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        })
      } else {
        Get(getUserPrompt(folderId, id), controller.signal).then(res => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              if (session.prompts.filter(x => x.id === res.data.id).length === 0) {
                setSession(prev => ({ ...prev, prompts: [...prev.prompts, { ...res.data, isOrgFolder: false, folderId: folderId }] }))
              }
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "Prompt Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        })
      }
    } else if (type === "file") {
      // get file and add it to list of files
      if (isOrgFolder) {
        Get(getOrgFile(folderId, id), controller.signal).then(res => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              setSession(prev => ({ ...prev, files: [...prev.files, { ...res.data, isOrgFolder: true, folderId: folderId }] }))
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "File Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        })
      } else {
        Get(getUserFile(folderId, id), controller.signal).then(res => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              setSession(prev => ({ ...prev, files: [...prev.files, { ...res.data, isOrgFolder: false, folderId: folderId }] }))
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "File Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        })
      }
    }
  }

  function refreshList() { } //empty

  function removeAsset(id: string, type: string) {
    if (type === "file") {
      // remove file from list
      setSession(prev => {
        var fileList = prev.files;
        fileList = fileList.filter(p => p.id !== id);
        return { ...prev, files: fileList };
      })
      setOpenConfirmationModal({ id: "", type: "" });
    } else if (type === "prompt") {
      // remove prompt from list
      setSession(prev => {
        var promptList = prev.prompts;
        promptList = promptList.filter(p => p.id !== id);
        return { ...prev, prompts: promptList };
      })
      setOpenConfirmationModal({ id: "", type: "" });
    } else {
      setAlert({ message: "Something went wrong. Try again later", type: "error" })
    }

  }

  function setConfirmationModal(folderId: string, id: string, isOrgFolder: boolean, type: string) {
    setOpenConfirmationModal({ id: id, type: type });
  }

  return moduleIds && session.name !== "" ? (
    <div className="modules">
      <Modal
        isOpen={showInfoModal}
        title={"Module Form Field Descriptions"}
        onRequestClose={() => setShowInfoModal(false)}
        actions={
          <Button sx={{ width: "100%" }} variant="contained" onClick={() => setShowInfoModal(false)}>
            Close
          </Button>
        }
      >
        <div className="">
          <Markdown>
            {`A **module** is a space for students to connect with AI using certain pre-approved sets of instructions. It can be used for an entire class term or you can have a module for a single assignment, unit, or other subset. \n
The **module description** will show up on the top of the module when it is selected. It should provide a brief description of what the module covers. The description should uniquely identify each module, so that users can determine which module they want. \n
The **Module Prompts** drop down shows you the various prompts, or instructions to the AI, that you can incorporate into your module.  You need at least one activated for your module to have any content. If you want to see the actual wording of the prompt, click on **Show Full Prompts**. \n
**Module Settings** let you control how the users can interact with the AI and the activated prompts within your module.  **Repeating Prompts** allows users to select another prompt after they interact with the prior prompt.  For example, if you activated Topics, Feedback, and Grammar, a user could first select “Grammar” and run through the AI interaction around that prompt. When finished, the student could then select one of the remaining options, such as “Feedback” for an interaction with the AI using the instructions embedded for “Feedback.” **Continued Interaction** allows students to converse back and forth with the AI even if the AI has not asked the user a question.  This allows the user to request additional information, explanations, expansions, etc. But it also allows the user to go off topic and interact freely with the AI. **Show Embedded Prompts** when checked will show the embedded prompt created by the admins. In most cases this will just be the first prompt in a conversation, but if Multiple Prompts is checked then it will affect future uses of embedded prompts. \n
 Select **Publish** when you are ready for users to have access to your module and interact with the AI as permitted by your selections here. Until you select “Publish,” only you see the module. `}
          </Markdown>
        </div>
      </Modal>
      <Modal
        isOpen={openDeleteModal}
        title={"Delete Module?"}
        onRequestClose={() => setOpenDeleteModal(false)}
        actions={
          <>
            <Button variant="contained" color="error" onClick={(e) => handleSubmit(e, false, true)}>
              Delete
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to permanently delete this module?</div>
      </Modal>
      <Modal
        isOpen={openDiscardModal}
        title={"Discard Changes?"}
        onRequestClose={() => setOpenDiscardModal(false)}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={() => navigator(-1)}>
              Discard
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDiscardModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to discard the changes to this module?</div>
      </Modal>
      <Modal
        isOpen={openActiveModal}
        title={"Unpublish Module?"}
        onRequestClose={() => setOpenActiveModal(false)}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={(e) => handleSubmit(e, false, false)}>
              Continue
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenActiveModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>This module is current published and available to the public. Continuing will make the module unavailable to students.</div>
      </Modal>
      <Modal
        isOpen={openSelectFolderModal}
        title={"Select Folder"}
        onRequestClose={() => setOpenSelectFolderModal(false)}
        actions={
          <>
            <Button variant="contained" color="secondary" onClick={() => setOpenSelectFolderModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>
          <ListFolders noShowMenu onClick={selectFolder} />
        </div>
      </Modal>
      <Modal
        isOpen={openSelectPromptModal.folderId !== ""}
        title={"Select Asset"}
        onRequestClose={() => setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })}
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })
                setOpenSelectFolderModal(true)
              }}
            >
              Back
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })}>
              Cancel
            </Button>
          </>
        }
      >
        <div>
          <ListFolderContents folderId={openSelectPromptModal.folderId} isOrgFolder={openSelectPromptModal.isOrgFolder} noShowMenu onClick={selectAsset} />
        </div>
      </Modal>
      <Modal
        isOpen={openConfirmationModal.id !== ""}
        title={"Remove Asset?"}
        onRequestClose={() => setOpenConfirmationModal({ id: "", type: "" })}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={() => removeAsset(openConfirmationModal.id, openConfirmationModal.type)}>
              Remove
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenConfirmationModal({ id: "", type: "" })}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to remove this asset from the module?</div>
      </Modal>
      <div className="modules__section-header">
        <div>
          <h3>Edit {session.name}</h3>
          <Tooltip title="Info">
            <IconButton onClick={() => setShowInfoModal(true)}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div>
          <Tooltip
            title={"Delete"}
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: '#da0222', //error color
                  '& .MuiTooltip-arrow': {
                    color: '#da0222',
                  },
                },
              },
            }}
          >
            <IconButton
              onClick={() => setOpenDeleteModal(true)}
              aria-label="Delete Module"
              className="modules__delete_background"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          &nbsp;&nbsp;&nbsp;
          <div>
            <ButtonGroup
              variant="contained"
              ref={anchorRefSave}
              aria-label="Button group with a nested menu"
            >
              <Button onClick={handleSaveClick}>{options[selectedIndexSave]}</Button>
              <Button
                size="small"
                aria-controls={openSave ? 'split-button-menu' : undefined}
                aria-expanded={openSave ? 'true' : undefined}
                aria-label="select save and activation strategy"
                aria-haspopup="menu"
                onClick={handleToggle}
              >
                <ArrowDropDownIcon />
              </Button>
            </ButtonGroup>
            <Popper
              sx={{
                zIndex: 1,
              }}
              open={openSave}
              anchorEl={anchorRefSave.current}
              role={undefined}
              transition
              disablePortal
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin:
                      placement === 'bottom' ? 'center top' : 'center bottom',
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={handleSaveClose}>
                      <MenuList id="split-button-menu" autoFocusItem>
                        {options.map((option, index) => (
                          <MenuItem
                            key={option}
                            selected={index === selectedIndexSave}
                            onClick={(event) => handleMenuItemClick(event, index)}
                            className={index === 2 ? "modules__discard_background" : ""}
                          >
                            {option}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>

          </div>

        </div>
      </div>
      <hr />
      <div className="modules__section-header">
        <span>* indicates a required field</span>
        <div>
          {session.isPublished ? (
            <>
              <TaskAltIcon color="success" />
              &nbsp;Published
            </>
          ) : (
            <>
              <DoNotDisturbIcon />
              &nbsp;Unpublished
            </>
          )}

        </div>
      </div>
      <Box className="modules__add">
        <form onSubmit={(e) => handleSubmit(e, true, false)}>
          <FormLabel>Enter Module Information</FormLabel>
          <TextField
            name="name"
            label="Module Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={session.name}
            onChange={handleChange}
            error={errors.name !== ""}
            helperText={errors.name}
            disabled={isLoading}
            required
          />
          <TextField
            name="moduleDescription"
            label="Module Description"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={session.moduleDescription}
            onChange={handleChange}
            error={errors.moduleDescription !== ""}
            helperText={errors.moduleDescription}
            disabled={isLoading}
            required
          />

          <hr />

          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <FormLabel sx={{ alignContent: "center" }}>Module Assets</FormLabel>
            <Button variant="outlined" onClick={() => setOpenSelectFolderModal(true)}>Add Asset</Button>
          </div>
          <div className="modules__prompt-list">
            {session.prompts.map((prompt: PromptType, i) => {
              return (
                <div key={i}>
                  <Prompt
                    prompt={prompt}
                    folder={{ //pass in temp folder
                      id: prompt.folderId ? prompt.folderId : "",
                      creator: {
                        email: "",
                        sub: "",
                        name: "",
                        family_name: "",
                        username: "",
                      },
                      isDeleted: false,
                      name: "",
                      prompts: [],
                      organization: "",
                      timestamp: "",
                      files: [],
                    }}
                    keyy={`${i}`}
                    refreshList={() => refreshList()}
                    loading={() => setIsLoading(true)}
                    noShowMenu={true}
                    showRemove
                    onClick={setConfirmationModal}
                  />
                </div>
              )
            })}
          </div>

          <div className="modules__prompt-list">
            {session.files && session.files.map((file: FileType, i) => {
              return (
                <div key={i}>
                  <File
                    file={file}
                    folder={{ //pass in temp folder
                      id: file.folderId ? file.folderId : "",
                      creator: {
                        email: "",
                        sub: "",
                        name: "",
                        family_name: "",
                        username: ""
                      },
                      isDeleted: false,
                      name: "",
                      prompts: [],
                      organization: "",
                      timestamp: "",
                      files: [],
                    }}
                    keyy={`${i}`}
                    refreshList={() => refreshList()}
                    loading={() => setIsLoading(true)}
                    noShowMenu={true}
                    showRemove
                    onClick={setConfirmationModal}
                  />
                </div>
              )
            })}
          </div>

          <hr />

          <FormLabel>Module Settings</FormLabel>
          {/* <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                isRepeating: !session.isRepeating
              }))
            }}
            checked={session.isRepeating}
            isDisabled={isLoading}
          >
            <span>
              Allow starter prompts to be re-selected during the conversation
            </span>
          </Checkbox> */}

          <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                showInitialPrompt: !session.showInitialPrompt
              }))
            }}
            checked={session.showInitialPrompt}
            isDisabled={isLoading}
          >
            <span>
              Show Embedded Prompt
            </span>
          </Checkbox>
          <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                raterEnabled: !session.raterEnabled
              }))
            }}
            checked={session.raterEnabled}
            isDisabled={isLoading}
          >
            <span>
              RATER Enabled
            </span>
          </Checkbox>
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}