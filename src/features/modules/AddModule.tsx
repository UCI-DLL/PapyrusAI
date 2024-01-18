import React, { useState, useEffect, useContext } from "react";
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
  FormControl,
  InputLabel,
  OutlinedInput,
  Menu
} from "@mui/material";
import { DocumentType, PromptType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import Put from "../../utility/Put";
import { putCreateModule } from "../../utility/endpoints/CourseEndpoints";
import CloseIcon from '@mui/icons-material/Close';
import Get from "../../utility/Get";
import { getPromptList } from "../../utility/endpoints/PromptEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import Markdown from "react-markdown";
import InfoIcon from '@mui/icons-material/Info';
import LinearProgress from '@mui/material/LinearProgress';
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

type AddModuleType = {
  name: string,
  moduleDescription: string,
  isRepeating: boolean,
  continuedInteraction: boolean,
  isPublished: boolean,
  documents: Array<DocumentType>
  showInitialPrompt: boolean,
  prompts: Array<string>
}
//Note: ^ missing showWizard. Need to add later

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export default function AddModule(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<AddModuleType>({
    name: "",
    moduleDescription: "",
    isRepeating: true,
    continuedInteraction: true,
    isPublished: false,
    documents: [],
    showInitialPrompt: true,
    prompts: []
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    isRepeating: "",
    continuedInteraction: "",
    isPublished: "",
    documents: "",
    showInitialPrompt: "",
    prompts: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newDoc, setNewDoc] = useState<DocumentType>({
    usageText: "Please enter your ",
    documentType: "",
    optional: false,
  });
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
  const [creatorList, setCreatorList] = useState<Array<CustomUserType>>([])
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
    } else {
      setIsLoading(false);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function getPrompts(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getPromptList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //Get the list of all prompts
          setPromptList((prev) => [...prev, ...res.data.filter((prompt: PromptType) => prompt.isDeleted === false)]);
          setFilteredPromptList((prev) => [...prev, ...res.data.filter((prompt: PromptType) => prompt.isDeleted === false)]);

          //Add creators to list
          var currentCreators = creatorList;
          res.data.forEach((prompt: PromptType) => {
            if (currentCreators.some(p => p.sub === prompt.creator.sub)) {
              //creator is already in the list so move on
            } else {
              currentCreators.push(prompt.creator);
            }
          });
          setCreatorList(currentCreators); //update creator list

          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (res.data.length >= limit) {
            getPrompts(res.data[res.data.length - 1].id, signal);
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

  function handleSubmit(e: React.FormEvent) {
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
      // post data back
      Put(putCreateModule(courseId), session).then((res) => {
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

  function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewDoc((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
**Module documents** are the texts that students will upload to the AI for the AI to read and use in determining the output. All documents that will be needed should be indicated in the panel labeled **Document Type**. **Usage Text** just shows you what the user will see. For example, if you label a document type as “Rubric,” Usage Text will read “Please enter your Rubric.” Other common document types are Assignment, Text, Essay, and Paragraph. But you can input anything! \n
**Current Documents** shows you what you have already added in the Document Type section to track your progress. \n
The **Module Prompts** drop down shows you the various prompts, or instructions to the AI, that you can incorporate into your module.  You need at least one activated for your module to have any content. If you want to see the actual wording of the prompt, click on **Show Full Prompts**. \n
**Module Settings** let you control how the users can interact with the AI and the activated prompts within your module.  **Repeating Prompts** allows users to select another prompt after they interact with the prior prompt.  For example, if you activated Topics, Feedback, and Grammar, a user could first select “Grammar” and run through the AI interaction around that prompt. When finished, the student could then select one of the remaining options, such as “Feedback” for an interaction with the AI using the instructions embedded for “Feedback.” **Continued Interaction** allows students to converse back and forth with the AI even if the AI has not asked the user a question.  This allows the user to request additional information, explanations, expansions, etc. But it also allows the user to go off topic and interact freely with the AI. Select **Publish** when you are ready for users to have access to your module and interact with the AI as permitted by your selections here. Until you select “Publish,” only you see the module. `}
          </Markdown>
        </div>

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
          <Button variant="contained" onClick={handleSubmit} type="submit">Save</Button>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={() => navigator("/")} color="secondary">Cancel</Button>
        </div>
      </div>
      <hr />
      <span>* indicates a required field</span>
      <Box className="modules__add">
        <form onSubmit={handleSubmit}>
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

          <FormLabel>Module Documents</FormLabel>
          {/* add section for user to add documents  */}
          <p>Add the documents you wish for the student to upload.</p>
          <div className="modules__adddocuments">
            <TextField
              name="documentType"
              label="Document Type"
              fullWidth
              sx={{ margin: ".5rem 0" }}
              value={newDoc.documentType}
              onChange={handleDocChange}
              disabled={isLoading}
              placeholder="Essay"
            />
            &nbsp;&nbsp;&nbsp;
            <TextField
              name="usageText"
              label="Usage Text"
              fullWidth
              sx={{ margin: ".5rem 0" }}
              value={newDoc.usageText}
              onChange={handleDocChange}
              disabled={isLoading}
              placeholder="Please enter your "
              InputProps={{
                endAdornment: <InputAdornment position="start">{newDoc.documentType}</InputAdornment>,
              }}
            />
            &nbsp;&nbsp;&nbsp;
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Checkbox
                onClick={() => {
                  setNewDoc((prev) => ({ ...prev, optional: !newDoc.optional }));
                }}
                checked={newDoc.optional}
                isDisabled={isLoading}
              >
                <span>
                  Optional
                </span>
              </Checkbox>
            </div>
            &nbsp;&nbsp;&nbsp;
            <Button
              sx={{ padding: "0rem 2rem" }}
              variant="contained"
              onClick={() => {
                setSession((prev) => ({
                  ...prev,
                  documents: [...session.documents, newDoc]
                }))
                setNewDoc({ documentType: "", usageText: "Please enter your ", optional: false });
              }}
            >
              Add
            </Button>
          </div>

          {session.documents.length > 0 && (
            <FormLabel>Current Documents</FormLabel>
          )}

          {session.documents.map((document, index) => {
            return (
              <div className="modules__documentslist" key={index}>
                <div style={{ paddingTop: "0.3rem" }}>
                  <div>Document Type: {document.documentType}</div>
                  <div>Usage Text: {document.usageText}</div>
                  <div>{document.optional ? "Optional" : "Required"}</div>
                </div>
                <Tooltip title="Remove">
                  <IconButton
                    aria-label="remove"
                    onClick={() => {
                      setSession((prev) => ({
                        ...prev,
                        documents: prev.documents.filter((d) => d.documentType !== document.documentType || d.usageText !== document.usageText)
                      }))
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </div>
            )
          })}

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
                sx={{ width: "100%", color: "black" }}
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
              Continued Interaction (Allow users to freely chat after initial prompts)
            </span>
          </Checkbox>

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
                isPublished: !session.isPublished
              }))
            }}
            checked={session.isPublished}
            isDisabled={isLoading}
          >
            <span>
              Publish
            </span>
          </Checkbox>
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}