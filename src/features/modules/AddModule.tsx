import React, { useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormLabel,
  MenuItem,
  Tooltip,
  IconButton,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList
} from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Checkbox } from "../../components/Checkbox";
import Put from "../../utility/Put";
import { putCreateModule } from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import Markdown from "react-markdown";
import InfoIcon from '@mui/icons-material/Info';
import LinearProgress from '@mui/material/LinearProgress';
import ListPrompts from "../library/ListPrompts";
import ListFolders from "../library/ListFolders";
import Get from "../../utility/Get";
import { getOrgPrompt, getUserPrompt } from "../../utility/endpoints/FolderEndpoints";
import { Prompt } from "../../components/Prompt";
import { FileType, PromptType } from "../../utility/types/CourseTypes";
import { File } from "../../components/File";


type AddModuleType = {
  name: string,
  moduleDescription: string,
  isRepeating: boolean,
  isPublished: boolean,
  showInitialPrompt: boolean,
  prompts: Array<PromptType>,
  files: Array<FileType>
}
//Note: ^ missing showWizard. Need to add later

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

const options = ['Save & Publish', 'Save without Publishing', 'Discard Changes'];

export default function AddModule(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<AddModuleType>({
    name: "",
    moduleDescription: "",
    isRepeating: false,
    isPublished: false,
    showInitialPrompt: true,
    prompts: [],
    files: []
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    isRepeating: "",
    isPublished: "",
    showInitialPrompt: "",
    prompts: "",
    files: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setAlert } = useContext(AlertContext);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [openSelectFolderModal, setOpenSelectFolderModal] = useState<boolean>(false);
  const [openSelectPromptModal, setOpenSelectPromptModal] = useState<{
    folderId: string,
    isOrgFolder: boolean,
  }>({ folderId: "", isOrgFolder: false });
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState<string>("");


  function handleSaveClick(e: any) {
    if (selectedIndexSave === 0) { //Save and activate
      handleSubmit(e, true);
    } else if (selectedIndexSave === 1) { //save and not activate
      handleSubmit(e, false);
    } else if (selectedIndexSave === 2) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and activate
      handleSubmit(e, true);
    } else if (index === 1) { //save and not activate
      handleSubmit(e, false);
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

  function handleSubmit(e: any, isPublished = false) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name missing" }))
    } else if (session.moduleDescription === "") {
      setErrors((prev: any) => ({ ...prev, moduleDescription: "Module description missing" }))
    } else {
      //create module
      const courseId = location.pathname.split("/")[2];
      // set is loading
      setIsLoading(true);
      const dataToSend = {
        name: session.name,
        moduleDescription: session.moduleDescription,
        isRepeating: session.isRepeating,
        isPublished: isPublished,
        showInitialPrompt: session.showInitialPrompt,
        prompts: session.prompts, //Send prompts with all information + folderId 
        isDeleted: false,
      }
      // post data back
      Put(putCreateModule(courseId), dataToSend).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //redirect to module list of that course
            navigator(`/courses/${courseId}/modules`);
            //pop up notifying user of creation
            setAlert({ message: "Module Created", type: "success" });
          }
        } else {
          // set errors
          setErrors({ name: res.data, moduleDescription: res.data })
        }
        // set is loading back 
        setIsLoading(false);
      });

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

  function selectPrompt(folderId: string, promptId: string, isOrgFolder: boolean) {
    setOpenSelectPromptModal({
      folderId: "",
      isOrgFolder: false
    });
    setIsLoading(true);
    const controller = new AbortController();
    // get prompt and add it to list of prompts
    if (isOrgFolder) {
      Get(getOrgPrompt(folderId, promptId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setSession(prev => ({ ...prev, prompts: [...prev.prompts, { ...res.data, isOrgFolder: true, folderId: folderId }] }))
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
      Get(getUserPrompt(folderId, promptId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setSession(prev => ({ ...prev, prompts: [...prev.prompts, { ...res.data, isOrgFolder: false, folderId: folderId }] }))
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
  }

  function refreshList() { } //empty

  function removePrompt(promptId: string) {
    // remove prompt from list
    setSession(prev => {
      var promptList = prev.prompts;
      promptList = promptList.filter(p => p.id !== promptId);
      return { ...prev, prompts: promptList };
    })
    setOpenConfirmationModal("");
  }

  function setConfirmationModal(folderId: string, promptId: string, isOrgFolder: boolean) {
    setOpenConfirmationModal(promptId);
  }

  return !isLoading ? (
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
        title={"Select Prompt"}
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
          <ListPrompts folderId={openSelectPromptModal.folderId} isOrgFolder={openSelectPromptModal.isOrgFolder} noShowMenu onClick={selectPrompt} />
        </div>
      </Modal>
      <Modal
        isOpen={openConfirmationModal !== ""}
        title={"Remove Prompt?"}
        onRequestClose={() => setOpenConfirmationModal("")}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={() => removePrompt(openConfirmationModal)}>
              Remove
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenConfirmationModal("")}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to remove this prompt from the module?</div>
      </Modal>
      <div className="modules__section-header">
        <div>
          <h3>Create Module</h3>
          <Tooltip title="Info">
            <IconButton onClick={() => setShowInfoModal(true)}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </div>
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
              aria-label="select save and ativation strategy"
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
      <hr />
      <span>* indicates a required field</span>
      <Box className="modules__add">
        <form onSubmit={(e) => handleSubmit(e, true)}>
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
            <FormLabel sx={{ alignContent: "center" }}>Module Prompts</FormLabel>
            <Button variant="outlined" onClick={() => setOpenSelectFolderModal(true)}>Add Prompt</Button>
          </div>

          <div className="modules__prompt-list">
            {session.prompts.map((prompt: PromptType, i) => {
              return (
                <Prompt
                  prompt={prompt}
                  folder={{ //pass in temp folder
                    id: prompt.folderId ? prompt.folderId : "",
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
              )
            })}
          </div>

          <hr />

          {/* TODO figure out files here  */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <FormLabel sx={{ alignContent: "center" }}>Module Files</FormLabel>
            <Button variant="outlined" onClick={() => setOpenSelectFolderModal(true)}>Add File</Button>
          </div>

          <div className="modules__prompt-list">
            {session.files.map((file: FileType, i) => {
              return (
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
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}