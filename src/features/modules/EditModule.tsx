

import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormLabel,
  InputAdornment,
  Select,
  MenuItem,
  ListItemText,
  SelectChangeEvent,
  Tooltip,
  IconButton,
  LinearProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  Menu,
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
import { PromptType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import { getPromptList } from "../../utility/endpoints/PromptEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import Markdown from "react-markdown";
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { CustomUserType } from "../../utility/types/UserTypes";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

type EditModuleType = {
  continuedInteraction: boolean,
  id: string,
  isDeleted: boolean,
  isPublished: boolean,
  isRepeating: boolean,
  isTemplate: boolean,
  moduleDescription: string,
  name: string,
  prompts: Array<string>,
  showInitialPrompt: boolean,
  showWizard: boolean,
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
    continuedInteraction: false,
    isPublished: false,
    showInitialPrompt: true,
    prompts: [],
    showWizard: true,
    isDeleted: false, //prev
    isTemplate: false,
    id: ""
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    prompts: ""
  });
  const [moduleIds, setModuleIds] = useState<{
    courseId: string,
    moduleId: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [promptList, setPromptList] = useState<Array<PromptType>>([]);
  const [showFullPrompts, setShowFullPrompts] = useState<boolean>(false);
  const { setAlert } = useContext(AlertContext);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [filter, setFilter] = useState<{
    search: string,
    sort: SortOptions,
    creator: string,
    startDate: Dayjs | null,
    endDate: Dayjs | null
  }>({
    search: "", //title or prompt
    sort: SortOptions.Ascending, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
    creator: "",//by creator or date range are filters
    startDate: null,
    endDate: null
  });
  const [filteredPromptList, setFilteredPromptList] = useState<Array<PromptType>>([]);
  const [creatorList, setCreatorList] = useState<Array<CustomUserType>>([]);
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openActiveModal, setOpenActiveModal] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    //get prompts
    const controller = new AbortController();
    setIsLoading(true);
    if (promptList.length === 0) {
      getPrompts("", controller.signal)
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
            setSession({ ...res.data, prompts: res.data.prompts.map((p: PromptType) => p.id) });
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

  function getPrompts(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getPromptList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.prompts && res.data.ScannedCount) {
          //Get the list of all prompts
          setPromptList((prev) => [...prev, ...res.data.prompts]);
          setFilteredPromptList((prev) => [...prev, ...res.data.prompts]);

          //Add creators to list
          var currentCreators = creatorList;
          res.data.prompts.forEach((prompt: PromptType) => {
            if(currentCreators.some(p => p.sub === prompt.creator.sub)) {
              //creator is already in the list so move on
            } else {
              currentCreators.push(prompt.creator);
            }
          });
          setCreatorList(currentCreators); //update creator list

          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (res.data.ScannedCount >= limit && res.data.LastEvaluatedKey) {
            getPrompts(res.data.LastEvaluatedKey.id, signal);
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
          setPromptList([]);
          setIsLoading(false);
        }
      }
    });
  }

  useEffect(() => {
    var filteredList = promptList;

    //handle search
    if (filter.search !== "") {
      filteredList = filteredList.filter(
        prompt => prompt.name.toLowerCase().includes(filter.search.toLowerCase()) ||
          prompt.prompt.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    //handle sort
    if (filter.sort as string === SortOptions.Descending) {
      filteredList = filteredList.sort((a, b) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0))
    } else if (filter.sort as string === SortOptions.Ascending) {
      filteredList = filteredList.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0))
    } else if (filter.sort as string === SortOptions.Oldest) {
      filteredList = filteredList.sort((a, b) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6)))
    } else if (filter.sort as string === SortOptions.Newest) {
      filteredList = filteredList.sort((a, b) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)))
    } else { //default to ascending order
      filteredList = filteredList.sort((a, b) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0))
    }

    //handle filters
    //Note: have to do a lot of date converting
    if (filter.startDate !== null) {
      filteredList = filteredList.filter(prompt => {
        if (filter.startDate !== null) {
          var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) > filter.startDate) {
            return prompt
          } else {
            return false
          }
        } else {
          return prompt
        }
      });
    }
    if (filter.endDate !== null) {
      filteredList = filteredList.filter(prompt => {
        if (filter.endDate !== null) {
          var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) < filter.endDate) {
            return prompt
          } else {
            return false
          }
        } else {
          return prompt
        }
      });
    }
    //handle creator filter
    if (filter.creator !== "") {
      filteredList = filteredList.filter(prompt => prompt.creator.sub === filter.creator);
    }

    //then set filtered list
    setFilteredPromptList(filteredList);

  }, [filter, promptList])

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

  function handleSortPromptList(e: SelectChangeEvent) {
    if (e.target.value as string === SortOptions.Ascending) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Ascending }));
      setFilteredPromptList(prev => prev.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0)));
    } else if (e.target.value as string === SortOptions.Descending) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Descending }));
      setFilteredPromptList(prev => prev.sort((a, b) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0)));
    } else if (e.target.value as string === SortOptions.Oldest) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Oldest }));
      setFilteredPromptList(prev => prev.sort((a, b) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6))));
    } else if (e.target.value as string === SortOptions.Newest) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Newest }));
      setFilteredPromptList(prev => prev.sort((a, b) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6))));
    } else {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Ascending }));
    }
  }

  function handleSearchPromptList(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  }

  function clearFilters() {
    setFilter({
      search: "",
      sort: SortOptions.Ascending,
      creator: "",
      startDate: null,
      endDate: null
    });
    setFilteredPromptList(promptList);
  }

  function handleSubmit(e: any, isPublished = false, isDeleted = false) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name missing" }))
    }
    else if (session.moduleDescription === "") {
      setErrors((prev: any) => ({ ...prev, moduleDescription: "Sign up code missing" }))
    } else {
      //Update course
      if (moduleIds) {
        // set is loading
        setIsLoading(true);
        const dataToSend = {
          name: session.name,
          moduleDescription: session.moduleDescription,
          isRepeating: session.isRepeating,
          continuedInteraction: session.continuedInteraction,
          isPublished: isPublished,
          showInitialPrompt: session.showInitialPrompt,
          prompts: session.prompts,
          showWizard: session.showWizard,
          isDeleted: isDeleted, 
          isTemplate: session.isTemplate,
          id: session.id
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

  const handleSelectChange = (event: SelectChangeEvent<typeof session.prompts>) => {
    const {
      target: { value },
    } = event;
    setSession((prev) => ({
      ...prev,
      prompts: typeof value === 'string' ? value.split(',') : value
    }))
  };

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
            <Button variant="contained" color="primary" onClick={(e) => handleSubmit(e, false, true)}>
              Submit
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
            <Button variant="contained" color="primary" onClick={() => navigator("/")}>
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
        <div>This modukle is current published and available to the public. Continuing will make the module unavailable to students.</div>
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

          <FormLabel>Module Prompts</FormLabel>
          {/* add prompt filtering  */}
          <div className="prompts__filter">
            <FormControl sx={{ minWidth: "200px" }}>
              <InputLabel shrink={true} id="sort-select-label">Sort</InputLabel>
              <Select
                value={filter.sort}
                onChange={handleSortPromptList}
                label="Sort"
                labelId="sort-select-label"
                id="sort-select"
                notched={true}
              >
                {Object.keys(SortOptions).map(key => {
                  return (
                    <MenuItem value={key} key={key}>{key}</MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            &nbsp;&nbsp;&nbsp;
            <FormControl fullWidth>
              <OutlinedInput
                id="outlined-adornment-message"
                placeholder="Search"
                sx={{ width: "100%" }}
                value={filter.search}
                onChange={handleSearchPromptList}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="sumbit new message"
                      edge="end"
                      type="submit"
                    >
                      {<SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
            &nbsp;&nbsp;&nbsp;

            <Button
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
              variant="outlined"
            >
              Filter
            </Button>
            <FormControl>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }} key={"menu"}>
                  <InputLabel shrink={true} sx={{ marginTop: "1rem" }}>Creator</InputLabel>
                  <Select
                    value={filter.creator}
                    onChange={(e: SelectChangeEvent) => {
                      setFilter((prev) => ({ ...prev, creator: e.target.value }))
                    }}
                    labelId="creator-select-label"
                    id="creator-select"
                    sx={{ width: 320, maxWidth: '100%', margin: "1rem" }}
                    renderValue={(selected) => {//find the creator name for the user id
                      return creatorList.find(p => p.sub === selected)?.name + " " + creatorList.find(p => p.sub === selected)?.family_name
                    }}
                  >
                    <MenuItem value={""} key={"NoCreator"}></MenuItem>
                    {creatorList.map((creator, index) => {
                      return (
                        <MenuItem value={creator.sub} key={index}>{creator.name} {creator.family_name}</MenuItem>
                      )
                    })}
                  </Select>
                  <LocalizationProvider dateAdapter={AdapterDayjs} >
                    <DatePicker
                      label="Start Date"
                      value={filter.startDate}
                      onChange={(value) => {
                        setFilter(prev => ({ ...prev, startDate: value }))
                      }}
                      disabled={isLoading}
                      sx={{ margin: "1rem" }}
                    />
                  </LocalizationProvider>
                  <LocalizationProvider dateAdapter={AdapterDayjs} >
                    <DatePicker
                      label="End Date"
                      value={filter.endDate}
                      onChange={(value) => {
                        setFilter(prev => ({ ...prev, endDate: value }))
                      }}
                      disabled={isLoading}
                      sx={{ margin: "1rem" }}
                    />
                  </LocalizationProvider>
                </div>
              </Menu>
            </FormControl>
            &nbsp;&nbsp;&nbsp;
            <Button onClick={clearFilters}>Clear</Button>
          </div>

          {/* add dropdown to handle prompts  */}
          <FormControl fullWidth>
            <InputLabel id="multiple-prompt-checkbox-select">Select Prompt(s)</InputLabel>
            <Select
              labelId="multiple-prompt-checkbox-select"
              id="multiple-prompt-checkbox-select"
              multiple
              value={session.prompts}
              onChange={handleSelectChange}
              renderValue={(selected) => {//find the name for the prompt id
                return selected.map((id) => promptList.find((p) => p.id === id)?.name).join(', ');
              }}
              label="Select Prompt(s)"
              MenuProps={MenuProps}
              fullWidth
            >
              {filteredPromptList.map((prompt, index) => (
                <MenuItem key={index} value={prompt.id}>
                  <Checkbox checked={session.prompts.indexOf(prompt.id) > -1} />
                  <ListItemText primary={prompt.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* button and list to show the actual full list of prompts and not just the names */}
          <Button onClick={() => setShowFullPrompts(!showFullPrompts)}>{showFullPrompts ? "Hide Full Prompts" : "Show Full Prompts"}</Button>
          {showFullPrompts ? (
            <div>
              {session.prompts.map((id, index) => {
                promptList.find((p) => p.id === id)
                return (
                  <div key={index}>
                    <div>{promptList.find((p) => p.id === id)?.name}</div>
                    <div>{promptList.find((p) => p.id === id)?.prompt}</div>
                  </div>
                )
              })}
            </div>
          ) : <></>}

          <hr />

          <FormLabel>Module Settings</FormLabel>
          <Checkbox
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
              Repeating Prompts
            </span>
          </Checkbox>

          <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                continuedInteraction: !session.continuedInteraction
              }))
            }}
            checked={session.continuedInteraction}
            isDisabled={isLoading}
          >
            <span>
              Continued Interaction
            </span>
          </Checkbox>
          <p>Allow users to freely chat after initial prompts.</p>

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