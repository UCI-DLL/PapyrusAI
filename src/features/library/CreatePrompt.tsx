

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
  LinearProgress,
  FormControl,
  InputLabel,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList,
  Tooltip
} from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Get from "../../utility/Get";
import { TagType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import Post from "../../utility/Post";
import { postCreateOrgPrompt, postCreateUserPrompt } from "../../utility/endpoints/FolderEndpoints";
import InfoIcon from '@mui/icons-material/Info';

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

export default function CreatePrompt(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
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
    folderId: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
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
      location.pathname.split("/")[4] === "createprompt"
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[3];
      //save the ids
      setPromptInfo({ isOrgFolder: true, folderId: folderId });
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "createprompt"
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[2];
      //save the ids
      setPromptInfo({ isOrgFolder: false, folderId: folderId });
    }

    if (tagList.length === 0) {
      getTags("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);


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
      handleSubmit(e);
    } else if (selectedIndexSave === 1) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and publish
      handleSubmit(e,);
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

  function handleSubmit(e: any) {
    e.preventDefault();
    if (newPrompt.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }))
    }
    else if (newPrompt.prompt === "") {
      setErrors((prev: any) => ({ ...prev, prompt: "Prompt is too short" }))
    }
    else if (promptInfo?.isOrgFolder) {
      setIsLoading(true)
      const dataToSend = {
        name: newPrompt.name,
        prompt: newPrompt.prompt,
        isDeleted: false,
        tags: newPrompt.tags
      }
      // post data back
      Post(postCreateOrgPrompt(promptInfo.folderId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of created
            setAlert({ message: "Prompt Created", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({ message: "Prompt could not be created. Try again later.", type: "error" });
          }
        }
        navigator(`/library/org/${promptInfo.folderId}`);
      });
    } else if (promptInfo) {
      setIsLoading(true)
      const dataToSend = {
        name: newPrompt.name,
        prompt: newPrompt.prompt,
        isDeleted: false,
        tags: newPrompt.tags
      }
      // post data back
      Post(postCreateUserPrompt(promptInfo.folderId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of Created
            setAlert({ message: "Prompt Created", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({ message: "Prompt could not be created. Try again later.", type: "error" })
        }
        navigator(`/library/${promptInfo.folderId}`);
      });
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
          <h3>Create Prompt</h3>
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
      <div>
        Prompts function in PapyrusAI as the first set of instructions sent to the AI that will guide
        students’ interactions with the AI. For more information on creating a prompt, please see the <a
          href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9dbj73hbtf5k"
          target="_blank" rel="noreferrer">“Creating a Prompt” section of our instructor guide
        </a>.
      </div>
      <hr />
      <div className="prompt__section-header">
        <span>* indicates a required field</span>
      </div>
      <Box className="prompt__add">
        <form onSubmit={(e) => handleSubmit(e)}>
          <FormLabel>Enter Prompt Information</FormLabel>
          <div className="form-tooltips">
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
            <Tooltip title="The name for the prompt that users will see. We recommend choosing a name that makes 
            it easy for students to understand what the prompt will do or help them with." enterTouchDelay={0}>
              <InfoIcon />
            </Tooltip>
          </div>
          <div className="form-tooltips">
            <TextField
              name="prompt"
              label="Prompt"
              fullWidth
              sx={{ margin: ".5rem 0" }}
              value={newPrompt.prompt}
              onChange={handleChange}
              error={errors.prompt !== ""}
              multiline
              maxRows={5}
              helperText={errors.prompt}
              disabled={isLoading}
              required
            />
            <Tooltip title="The instructions that will be sent to the AI (i.e., the first message sent to 
            the AI that will guide the interaction)." enterTouchDelay={0}>
              <InfoIcon />
            </Tooltip>
          </div>
          {/* add dropdown to handle tags  */}
          <div className="form-tooltips">
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
            <Tooltip title="Tags describe a feature of the prompts and will be used to allow for sorting prompts by type." enterTouchDelay={0}>
              <InfoIcon />
            </Tooltip>
          </div>
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}