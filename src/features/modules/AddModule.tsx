import React, { useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormLabel,
  MenuItem,
  Tooltip,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Checkbox } from "../../components/Checkbox";
import Put from "../../utility/Put";
import { putCreateModule } from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import InfoIcon from "@mui/icons-material/Info";
import LinearProgress from "@mui/material/LinearProgress";
import ListFolderContents from "../library/ListFolderContents";
import ListFolders from "../library/ListFolders";
import Get from "../../utility/Get";
import {
  getOrgFile,
  getOrgPrompt,
  getUserFile,
  getUserPrompt,
} from "../../utility/endpoints/FolderEndpoints";
import { Prompt } from "../../components/Prompt";
import { FileType, PromptType } from "../../utility/types/CourseTypes";
import { File } from "../../components/File";

type AddModuleType = {
  name: string;
  moduleDescription: string;
  isRepeating: boolean;
  isPublished: boolean;
  showInitialPrompt: boolean;
  prompts: Array<PromptType>;
  files: Array<FileType>;
  raterEnabled: boolean;
};
//Note: ^ missing showWizard. Need to add later

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

const options = [
  "Save & Publish",
  "Save without Publishing",
  "Discard Changes",
];

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
    files: [],
    raterEnabled: false,
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    isRepeating: "",
    isPublished: "",
    showInitialPrompt: "",
    prompts: "",
    files: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setAlert } = useContext(AlertContext);
  const [openSelectFolderModal, setOpenSelectFolderModal] =
    useState<boolean>(false);
  const [openSelectPromptModal, setOpenSelectPromptModal] = useState<{
    folderId: string;
    isOrgFolder: boolean;
  }>({ folderId: "", isOrgFolder: false });
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] =
    useState<boolean>(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState<{
    id: string;
    type: string;
  }>({
    id: "",
    type: "",
  });

  function handleSaveClick(e: any) {
    if (selectedIndexSave === 0) {
      //Save and publish
      handleSubmit(e, true);
    } else if (selectedIndexSave === 1) {
      //save and not publish
      handleSubmit(e, false);
    } else if (selectedIndexSave === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
  }

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    if (index === 0) {
      //Save and publish
      handleSubmit(e, true);
    } else if (index === 1) {
      //save and not publish
      handleSubmit(e, false);
    } else if (index === 2) {
      //discard changes
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
      setErrors((prev: any) => ({ ...prev, name: "Name missing" }));
    } else if (session.moduleDescription === "") {
      setErrors((prev: any) => ({
        ...prev,
        moduleDescription: "Module description missing",
      }));
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
        files: session.files, //send files with all information + folderid
        isDeleted: false,
        raterEnabled: session.raterEnabled,
      };
      // post data back
      Put(putCreateModule(courseId), dataToSend).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //redirect to module list of that course
            navigator(`/courses/${courseId}/modules`);
            //pop up notifying user of creation
            setAlert({ message: "Module Created", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setErrors({ name: res.data, moduleDescription: res.data });
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
      isOrgFolder: isOrgFolder,
    });
    setOpenSelectFolderModal(false);
  }

  function selectAsset(
    folderId: string,
    id: string,
    isOrgFolder: boolean,
    type: string
  ) {
    //type is "prompt" or "file"
    setOpenSelectPromptModal({
      folderId: "",
      isOrgFolder: false,
    });
    setIsLoading(true);
    const controller = new AbortController();
    //check if asset is prompt or file
    if (type === "prompt") {
      // get prompt and add it to list of prompts
      if (isOrgFolder) {
        Get(getOrgPrompt(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              if (
                session.prompts.filter((x) => x.id === res.data.id).length === 0
              ) {
                setSession((prev) => ({
                  ...prev,
                  prompts: [
                    ...prev.prompts,
                    { ...res.data, isOrgFolder: true, folderId: folderId },
                  ],
                }));
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
        });
      } else {
        Get(getUserPrompt(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              if (
                session.prompts.filter((x) => x.id === res.data.id).length === 0
              ) {
                setSession((prev) => ({
                  ...prev,
                  prompts: [
                    ...prev.prompts,
                    { ...res.data, isOrgFolder: false, folderId: folderId },
                  ],
                }));
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
        });
      }
    } else if (type === "file") {
      // get file and add it to list of files
      if (isOrgFolder) {
        Get(getOrgFile(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              setSession((prev) => ({
                ...prev,
                files: [
                  ...prev.files,
                  { ...res.data, isOrgFolder: true, folderId: folderId },
                ],
              }));
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
        });
      } else {
        Get(getUserFile(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              setSession((prev) => ({
                ...prev,
                files: [
                  ...prev.files,
                  { ...res.data, isOrgFolder: false, folderId: folderId },
                ],
              }));
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
        });
      }
    }
  }

  function refreshList() {} //empty

  function removeAsset(id: string, type: string) {
    if (type === "file") {
      // remove file from list
      setSession((prev) => {
        var fileList = prev.files;
        fileList = fileList.filter((p) => p.id !== id);
        return { ...prev, files: fileList };
      });
      setOpenConfirmationModal({ id: "", type: "" });
    } else if (type === "prompt") {
      // remove prompt from list
      setSession((prev) => {
        var promptList = prev.prompts;
        promptList = promptList.filter((p) => p.id !== id);
        return { ...prev, prompts: promptList };
      });
      setOpenConfirmationModal({ id: "", type: "" });
    } else {
      setAlert({
        message: "Something went wrong. Try again later",
        type: "error",
      });
    }
  }

  function setConfirmationModal(
    folderId: string,
    id: string,
    isOrgFolder: boolean,
    type: string
  ) {
    setOpenConfirmationModal({ id: id, type: type });
  }

  return !isLoading ? (
    <div className="modules">
      <Modal
        isOpen={showSavePublishTooltip}
        title={"What is Save & Publish?"}
        onRequestClose={() => setShowSavePublishTooltip(false)}
        actions={
          <>
            <Button
              variant="contained"
              onClick={() => setShowSavePublishTooltip(false)}
            >
              Close
            </Button>
          </>
        }
      >
        <div>
          To save and publish (i.e., make visible to students) your module,
          select “Save & Publish”. If you want to save your module without
          publishing it, select “Save without Publishing”
          <span style={{ fontStyle: "italic" }}>
            {" "}
            Note: Choosing this option after the module has already been
            published will unpublish the module.
          </span>
        </div>
      </Modal>
      <Modal
        isOpen={openDiscardModal}
        title={"Discard Changes?"}
        onRequestClose={() => setOpenDiscardModal(false)}
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigator(-1)}
            >
              Discard
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenDiscardModal(false)}
            >
              Cancel
            </Button>
          </>
        }
      >
        <div>
          Are you sure you would like to discard the changes to this module?
        </div>
      </Modal>
      <Modal
        isOpen={openSelectFolderModal}
        title={"Select Folder"}
        onRequestClose={() => setOpenSelectFolderModal(false)}
        actions={
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenSelectFolderModal(false)}
            >
              Cancel
            </Button>
          </>
        }
      >
        <div>
          <ListFolders noShowMenu onClick={selectFolder} compactGrid />
        </div>
      </Modal>
      <Modal
        isOpen={openSelectPromptModal.folderId !== ""}
        title={"Select Asset"}
        onRequestClose={() =>
          setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })
        }
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenSelectPromptModal({ folderId: "", isOrgFolder: false });
                setOpenSelectFolderModal(true);
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() =>
                setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })
              }
            >
              Cancel
            </Button>
          </>
        }
      >
        <div>
          <ListFolderContents
            folderId={openSelectPromptModal.folderId}
            isOrgFolder={openSelectPromptModal.isOrgFolder}
            noShowMenu
            onClick={selectAsset}
            compactGrid
          />
        </div>
      </Modal>
      <Modal
        isOpen={openConfirmationModal.id !== ""}
        title={"Remove Asset?"}
        onRequestClose={() => setOpenConfirmationModal({ id: "", type: "" })}
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                removeAsset(
                  openConfirmationModal.id,
                  openConfirmationModal.type
                )
              }
            >
              Remove
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenConfirmationModal({ id: "", type: "" })}
            >
              Cancel
            </Button>
          </>
        }
      >
        <div>
          Are you sure you would like to remove this asset from the module?
        </div>
      </Modal>
      <div className="modules__section-header">
        <div>
          <h3>Create Module</h3>
        </div>
        <div className="form-tooltips">
          <button onClick={() => setShowSavePublishTooltip(true)}>
            <InfoIcon />
          </button>
          <ButtonGroup
            variant="contained"
            ref={anchorRefSave}
            aria-label="Button group with a nested menu"
          >
            <Button onClick={handleSaveClick}>
              {options[selectedIndexSave]}
            </Button>
            <Button
              size="small"
              aria-controls={openSave ? "split-button-menu" : undefined}
              aria-expanded={openSave ? "true" : undefined}
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
                    placement === "bottom" ? "center top" : "center bottom",
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
                          className={
                            index === 2 ? "modules__discard_background" : ""
                          }
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
      <div>
        Modules provide users access to conversations with the AI. Modules can
        be customized to allow or restrict access to specific assets, including
        conversation prompts (AI instructions) and documents. For more
        information on creating a module, please see the{" "}
        <a
          href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9og8mgqg1ofk"
          target="_blank"
          rel="noreferrer"
        >
          “Creating a Module” section of our instructor guide
        </a>
        .
      </div>
      <hr />
      <span>* indicates a required field</span>
      <Box className="modules__add">
        <form onSubmit={(e) => handleSubmit(e, true)}>
          <FormLabel>Enter Module Information</FormLabel>
          <div className="form-tooltips">
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
            <Tooltip
              title="The name for your module that users will see."
              enterTouchDelay={0}
            >
              <InfoIcon />
            </Tooltip>
          </div>
          <div className="form-tooltips">
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
            <Tooltip
              title="The description for your module to help users understand the purpose or instructional goals for the module."
              enterTouchDelay={0}
            >
              <InfoIcon />
            </Tooltip>
          </div>
          <hr />

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.4rem",
            }}
          >
            <FormLabel sx={{ alignContent: "center" }}>Module Assets</FormLabel>
            <Button
              variant="outlined"
              onClick={() => setOpenSelectFolderModal(true)}
            >
              Add Asset
            </Button>
          </div>

          {session.prompts.length < 1 && session.files.length < 1 ? (
            <div>
              No assets added. To add an asset (including prompts and
              documents), click “Add Asset” to the right.
            </div>
          ) : (
            <>
              <div className="modules__prompt-list">
                {session.prompts.map((prompt: PromptType, i) => {
                  return (
                    <div key={i}>
                      <Prompt
                        prompt={prompt}
                        folder={{
                          //pass in temp folder
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
                  );
                })}
              </div>

              <div className="modules__prompt-list">
                {session.files &&
                  session.files.map((file: FileType, i) => {
                    return (
                      <div key={i}>
                        <File
                          file={file}
                          folder={{
                            //pass in temp folder
                            id: file.folderId ? file.folderId : "",
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
                    );
                  })}
              </div>
            </>
          )}

          <hr />

          <div className="form-tooltips">
            <FormLabel>Module Settings</FormLabel>
            <Tooltip
              title="You can customize your module to allow or restrict certain functions."
              enterTouchDelay={0}
            >
              <InfoIcon />
            </Tooltip>
          </div>

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
                showInitialPrompt: !session.showInitialPrompt,
              }));
            }}
            checked={session.showInitialPrompt}
            isDisabled={isLoading}
          >
            <span>Show Embedded Prompt</span>
          </Checkbox>
          <div style={{ marginBottom: "1rem" }}>
            Allows users to see the full text of the embedded prompt with which
            they begin their chat with the AI. Unchecking this will mean that
            the user will not be able to see the initial text of the prompt sent
            initially to the AI. For more information on why you might choose
            one or the other, see the{" "}
            <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9og8mgqg1ofk"
              target="_blank"
              rel="noreferrer"
            >
              “Creating a Module” section of our instructor guide
            </a>
            .
          </div>
          <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                raterEnabled: !session.raterEnabled,
              }));
            }}
            checked={session.raterEnabled}
            isDisabled={isLoading}
          >
            <span>RATER Enabled</span>
          </Checkbox>
          <div>
            Provide students with more tailored feedback on their argumentative
            essays. Should only be used with essay drafts longer than 150 words.
            Checking this will also provide analytics on students’ essays with
            the “View” button.
          </div>
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  );
}
