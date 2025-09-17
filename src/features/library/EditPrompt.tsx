

import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormLabel,
  Select,
  MenuItem,
  ListItemText,
  SelectChangeEvent,
  Tooltip,
  IconButton,
  LinearProgress,
  FormControl,
  InputLabel,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Get from "../../utility/Get";
import Put from "../../utility/Put";
import { PromptType, TagType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/ui/checkbox";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import { getOrgPrompt, getUserPrompt, postUpdateOrgPrompt, postUpdateUserPrompt } from "../../utility/endpoints/FolderEndpoints";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};


const options = ['Save & Publish', 'Discard Changes'];

export default function EditPrompt(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [prompt, setPrompt] = useState<PromptType>();
  const [newPrompt, setNewPrompt] = useState<{
    name: string, prompt: string, tags: Array<string>
  }>({
    name: "", prompt: "", tags: []
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    prompt: "",
    tags: ""
  });
  const [promptInfo, setPromptInfo] = useState<{
    isOrgFolder: boolean,
    folderId: string,
    promptId: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);


  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing 
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] === "org" &&
      location.pathname.split("/")[3] &&
      location.pathname.split("/")[4] === "prompts" &&
      location.pathname.split("/")[5]
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[3];
      const promptId = location.pathname.split("/")[5]
      //save the ids
      setPromptInfo({ isOrgFolder: true, folderId: folderId, promptId: promptId });
      getPrompt(true, folderId, promptId, controller.signal)
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "prompts" &&
      location.pathname.split("/")[4]
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[2];
      const promptId = location.pathname.split("/")[4]
      //save the ids
      setPromptInfo({ isOrgFolder: false, folderId: folderId, promptId: promptId });
      getPrompt(false, folderId, promptId, controller.signal)
    }

    if (tagList.length === 0) {
      getTags("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function getPrompt(isOrg: boolean, folderId: string, promptId: string, signal: AbortSignal) {
    if (!isOrg) {
      Get(getUserPrompt(folderId, promptId), signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setPrompt(res.data);
            setNewPrompt(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/library");
            setAlert({ message: "Prompt Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    } else {
      Get(getOrgPrompt(folderId, promptId), signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setPrompt(res.data);
            setNewPrompt(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/library");
            setAlert({ message: "Prompt Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    }
  }


  function getTags(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getTagList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.tags && res.data.ScannedCount !== undefined) {
          //Get the list of all folders
          setTagList((prev) => [...prev, ...res.data.tags]);
          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getTags(res.data.LastEvaluatedKey.id, signal);
          } else {
            setIsLoading(false);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setIsLoading(false);
        }
      }
    });
  }

  function handleSaveClick(e: any) {
    if (selectedIndexSave === 0) { //Save and publish
      handleSubmit(e, false);
    } else if (selectedIndexSave === 1) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and publish
      handleSubmit(e, false);
    } else if (index === 1) { //discard changes
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

  function handleSubmit(e: any, isDeleted = false) {
    e.preventDefault();
    setIsLoading(true);
    const dataToSend = {
      name: newPrompt.name,
      prompt: newPrompt.prompt,
      isDeleted: isDeleted,
      tags: newPrompt.tags
    }
    if (!isDeleted && newPrompt.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }))
      setIsLoading(false);
    }
    else if (!isDeleted && newPrompt.prompt === "") {
      setErrors((prev: any) => ({ ...prev, prompt: "Prompt is too short" }))
      setIsLoading(false);
    }
    else if (promptInfo && promptInfo.isOrgFolder) {
      // post data back
      Put(postUpdateOrgPrompt(promptInfo.folderId, promptInfo.promptId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of update
            setAlert({ message: "Prompt Updated", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({ message: "Prompt could not be updated. Try again later.", type: "error" });
          }
        }
        navigator(`/library/org/${promptInfo.folderId}`);
        setIsLoading(false);
      });
    } else if (promptInfo) {
      // post data back
      Put(postUpdateUserPrompt(promptInfo.folderId, promptInfo.promptId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of updated
            setAlert({ message: "Prompt updated", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({ message: "Prompt could not be updated. Try again later.", type: "error" })
        }
        navigator(`/library/${promptInfo.folderId}`);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewPrompt((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleSelectChange = (event: SelectChangeEvent<typeof newPrompt.tags>) => {
    const {
      target: { value },
    } = event;
    setNewPrompt((prev) => ({
      ...prev,
      tags: typeof value === 'string' ? value.split(',') : value
    }))
  };

  return promptInfo && !isLoading ? (
    <div className="prompt">
      {newPrompt.name ? (
        <>
          <Modal
            isOpen={openDeleteModal}
            title={"Delete Prompt?"}
            onRequestClose={() => setOpenDeleteModal(false)}
            actions={
              <>
                <Button variant="contained" color="error" onClick={(e) => handleSubmit(e, true)}>
                  Delete
                </Button>
                <Button variant="contained" color="secondary" onClick={() => setOpenDeleteModal(false)}>
                  Cancel
                </Button>
              </>
            }
          >
            <div>Are you sure you would like to permanently delete this prompt?</div>
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
            <div>Are you sure you would like to discard the changes to this prompt?</div>
          </Modal>
          <div className="prompt__section-header">
            <div>
              <h3>Edit {prompt?.name}</h3>
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
                  aria-label="Delete Prompt"
                  className="prompt__delete_background"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              &nbsp;&nbsp;&nbsp;
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
                              className={index === 2 ? "prompt__discard_background" : ""}
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
          <div className="prompt__section-header">
            <span>* indicates a required field</span>
          </div>
          <Box className="prompt__add">
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <FormLabel>Enter Prompt Information</FormLabel>
              <TextField
                name="name"
                label="Prompt Name"
                fullWidth
                sx={{ margin: ".5rem 0" }}
                value={newPrompt.name}
                onChange={handleChange}
                error={errors.name !== ""}
                helperText={errors.name}
                disabled={isLoading}
                required
              />
              <TextField
                name="prompt"
                label="Prompt"
                fullWidth
                sx={{ margin: ".5rem 0" }}
                value={newPrompt.prompt}
                onChange={handleChange}
                error={errors.prompt !== ""}
                helperText={errors.prompt}
                disabled={isLoading}
                multiline
                maxRows={5}
                required
              />

              {/* add dropdown to handle tags  */}
              <FormControl fullWidth sx={{ margin: ".5rem 0" }}>
                <InputLabel id="multiple-tag-checkbox-select">Tags</InputLabel>
                <Select
                  labelId="multiple-tag-checkbox-select"
                  id="multiple-tag-checkbox-select"
                  multiple
                  value={newPrompt.tags}
                  onChange={handleSelectChange}
                  renderValue={(selected) => {//find the name for the prompt id
                    return selected.map((id) => tagList.find((p) => p.id === id)?.id).join(', ');
                  }}
                  label="Tags"
                  MenuProps={MenuProps}
                  fullWidth
                  disabled={isLoading}
                >
                  {tagList.map((tag, index) => (
                    <MenuItem key={index} value={tag.id}>
                      <Checkbox checked={newPrompt.tags.indexOf(tag.id) > -1} />
                      <ListItemText primary={tag.id} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </form>
          </Box>
        </>
      ) : (
        <div>Prompt does not exist</div>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}