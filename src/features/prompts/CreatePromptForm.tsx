import React, { useState } from "react";
import { Button, Box, TextField, FormLabel } from "@mui/material";
import Post from "../../utility/Post";
import { postCreatePrompt } from "../../utility/endpoints/PromptEndpoints";

/**
 * This form is to update user's missing data
 * Note: This is hard coded with only name and family_name 
 */

interface MissingUserInfoFormProps {
  closeForm: () => void,
}

export default function CreatePromptForm({
  closeForm
}: MissingUserInfoFormProps): JSX.Element {
  //New user information
  const [session, setSession] = useState<{
    name: string,
    prompt: string
  }>({
    name: "",
    prompt: ""
  });
  const [errors, setErrors] = useState<{
    name: string,
    prompt: string
  }>({
    name: "",
    prompt: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Prompt name missing" }))
    } else if (session.prompt === "") {
      setErrors((prev) => ({ ...prev, prompt: "Prompt missing" }))
    } else {
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postCreatePrompt(), session).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //close modal if user data was updated
            setSession({ name: "", prompt: "" });
            closeForm();
          }
        } else {
          // set errors
          setErrors({ name: res.data, prompt: res.data })
        }
        // set is loading back 
        setIsLoading(false);
      })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <div className="addpromptform">
      <Box className="addpromptform__add">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
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
          &nbsp;&nbsp;&nbsp;
          <Button
            variant="contained"
            onClick={handleSubmit}
            type="submit"
            disabled={isLoading}
          >
            Create Prompt
          </Button>
        </form>
      </Box>
    </div>
  )
}