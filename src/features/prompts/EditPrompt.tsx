import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, Box, TextField, FormLabel } from "@mui/material";
import Get from "../../utility/Get";
import Put from "../../utility/Put";
import { PromptType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import LinearProgress from '@mui/material/LinearProgress';
import { getPrompt, updatePrompt } from "../../utility/endpoints/PromptEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";

type EditPromptType = {
  isDeleted: boolean,
  name: string,
  prompt: string,
}

export default function EditPrompt(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditPromptType>({
    name: "",
    prompt: "",
    isDeleted: false,
  });
  const [prevSession, setPrevSession] = useState<PromptType | undefined>();
  const [errors, setErrors] = useState<EditPromptType>({
    name: "",
    prompt: "",
    isDeleted: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);

  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing 
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "prompts" &&
      location.pathname.split("/")[2]
    ) {
      //get prev prompt data
      const promptId = location.pathname.split("/")[2];
      Get(getPrompt(promptId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //set prev prompt data
            setPrevSession(res.data);
            //also set session
            setSession({
              name: res.data.name,
              prompt: res.data.prompt,
              isDeleted: res.data.isDeleted,
            });
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/prompts");
            setAlert({message: "Prompt Does Not Exist", type: "error"});
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Name missing" }))
    }
    else if (session.prompt === "") {
      setErrors((prev) => ({ ...prev, signUpCode: "Prompt missing" }))
    } else {
      //Update prompt
      if (prevSession) {
        // set is loading
        setIsLoading(true);
        // post data back
        Put(updatePrompt(prevSession.id), session).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data) {
              //redirect to prompt list
              navigator("/prompts");
              //pop up notifying user of creation
              setAlert({message: "Prompt updated", type: "success"})
            }
          } else {
            // set errors
            setErrors({
              name: res.data,
              prompt: res.data,
              isDeleted: res.data,
            });
            setAlert({message: res.data, type: "error"})
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

  return !isLoading ? (
    <div className="prompts">
      {prevSession ? (
        <>
          <div className="prompts__section-header">
            <h3>Edit {prevSession.name}</h3>
            <div>
              <Button variant="contained" onClick={handleSubmit} type="submit">Save</Button>
              &nbsp;&nbsp;&nbsp;
              <Button variant="contained" onClick={() => navigator("/")} color="secondary">Cancel</Button>
            </div>
          </div>
          <hr />
          <Box className="prompts__add">
            <form onSubmit={handleSubmit}>
              <FormLabel>Enter Prompt Information</FormLabel>
              <TextField
                name="name"
                label="Prompt Name"
                fullWidth
                sx={{ margin: ".5rem 0" }}
                value={session.name}
                onChange={handleChange}
                error={errors.name !== ""}
                helperText={errors.name}
                disabled={isLoading}
              />
              <TextField
                name="prompt"
                label="Prompt"
                fullWidth
                sx={{ margin: ".5rem 0" }}
                multiline
                maxRows={6}
                value={session.prompt}
                onChange={handleChange}
                error={errors.prompt !== ""}
                helperText={errors.prompt}
                disabled={isLoading}
              />
              <Checkbox
                onClick={() => {
                  setSession((prev) => ({
                    ...prev,
                    isDeleted: !session.isDeleted
                  }))
                }}
                checked={session ? session.isDeleted : false}
                isDisabled={isLoading}
              >
                <span>
                  Delete
                </span>
              </Checkbox>
            </form>
          </Box>
        </>
      ) : (
        <div>Prompt Not Found</div>
      )}

    </div>
  ) : (
    <LinearProgress />
  )
}