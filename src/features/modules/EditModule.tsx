

import React, { useContext, useEffect, useState } from "react";
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
  LinearProgress
} from "@mui/material";
import Get from "../../utility/Get";
import { getModule, putUpdateModule } from "../../utility/endpoints/CourseEndpoints";
import Put from "../../utility/Put";
import { DocumentType, PromptType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import CloseIcon from '@mui/icons-material/Close';
import { getPromptList } from "../../utility/endpoints/PromptEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import Markdown from "react-markdown";
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

type EditModuleType = {
  continuedInteraction: boolean,
  documents: Array<DocumentType>,
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

export default function EditModule(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditModuleType>({
    name: "",
    moduleDescription: "",
    isRepeating: false,
    continuedInteraction: false,
    isPublished: false,
    documents: [],
    showInitialPrompt: true,
    prompts: [],
    showWizard: true,
    isDeleted: false,
    isTemplate: false,
    id: ""
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    documents: "",
    prompts: ""
  });
  const [moduleIds, setModuleIds] = useState<{
    courseId: string,
    moduleId: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newDoc, setNewDoc] = useState<DocumentType>({
    usageText: "Please enter your ",
    documentType: ""
  });
  const [promptList, setPromptList] = useState<Array<PromptType>>([]);
  const [showFullPrompts, setShowFullPrompts] = useState<boolean>(false);
  const { setAlert } = useContext(AlertContext);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

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
        if (res.data) {
          //Get the list of all prompts
          setPromptList((prev) => [...prev, ...res.data]);

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

  function handleSubmit(e: React.FormEvent) {
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
        //dont send signupcode if it didnt change
        // post data back
        Put(putUpdateModule(moduleIds.courseId, moduleIds.moduleId), session).then((res) => {
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
              isActive: res.data
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
**Module documents** are the texts that students will upload to the AI for the AI to read and use in determining the output. All documents that will be needed should be indicated in the panel labeled **Document Type**. **Usage Text** just shows you what the user will see. For example, if you label a document type as “Rubric,” Usage Text will read “Please enter your Rubric.” Other common document types are Assignment, Text, Essay, and Paragraph. But you can input anything! \n
**Current Documents** shows you what you have already added in the Document Type section to track your progress. \n
The **Module Prompts** drop down shows you the various prompts, or instructions to the AI, that you can incorporate into your module.  You need at least one activated for your module to have any content. If you want to see the actual wording of the prompt, click on **Show Full Prompts**. \n
**Module Settings** let you control how the users can interact with the AI and the activated prompts within your module.  **Repeating Prompts** allows users to select another prompt after they interact with the prior prompt.  For example, if you activated Topics, Feedback, and Grammar, a user could first select “Grammar” and run through the AI interaction around that prompt. When finished, the student could then select one of the remaining options, such as “Feedback” for an interaction with the AI using the instructions embedded for “Feedback.” **Continued Interaction** allows students to converse back and forth with the AI even if the AI has not asked the user a question.  This allows the user to request additional information, explanations, expansions, etc. But it also allows the user to go off topic and interact freely with the AI. Select **Publish** when you are ready for users to have access to your module and interact with the AI as permitted by your selections here. Until you select “Publish,” only you see the module. `}
          </Markdown>
        </div>

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
          <Button variant="contained" onClick={handleSubmit} type="submit">Save</Button>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={() => navigator("/")} color="secondary">Cancel</Button>
        </div>
      </div>
      <hr />
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
            <Button
              sx={{ padding: "0rem 2rem" }}
              variant="contained"
              onClick={() => {
                setSession((prev) => ({
                  ...prev,
                  documents: [...session.documents, newDoc]
                }));
                setNewDoc({ documentType: "", usageText: "Please enter your " });
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
                <div>
                  <div>{document.documentType}</div>
                  <div>{document.usageText}</div>
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
          {/* add dropdown to handle prompts  */}
          <Select
            labelId="multiple-prompt-checkbox-select"
            id="multiple-prompt-checkbox-select"
            multiple
            value={session.prompts}
            onChange={handleSelectChange}
            renderValue={(selected) => {//find the name for the prompt id
              return selected.map((id) => promptList.find((p) => p.id === id)?.name).join(', ');
            }}
            MenuProps={MenuProps}
            fullWidth
          >
            {promptList.map((prompt, index) => (
              <MenuItem key={index} value={prompt.id}>
                <Checkbox checked={session.prompts.indexOf(prompt.id) > -1} />
                <ListItemText primary={prompt.name} />
              </MenuItem>
            ))}
          </Select>
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

          {/* <Checkbox
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
              Show Initial Prompt
            </span>
          </Checkbox> */}

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