import { PromptType } from "../../utility/types/CourseTypes"
import { useState } from "react";
import {
  Button,
  FormLabel,
} from "@mui/material";
import { Prompt } from "../../components/Prompt";


interface ChatWizardProps {
  prompts: Array<PromptType> | undefined;
  returnPrompt: (selectedPrompt: string) => void;
}

export default function ChatWizard({
  prompts,
  returnPrompt,
}: ChatWizardProps): JSX.Element {
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [error, setError] = useState("");

  return prompts && prompts.length > 0 ? (
    <div className="chat__wizard">
      <h6>Select prompt option</h6>
      <div className="chat__prompt-list">
        {prompts.map((prompt: PromptType, i) => {
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
                timestamp: ""
              }}
              keyy={`${i}`}
              refreshList={() => { }}
              loading={() => { }}
              noShowMenu={true}
              noShowDesc={true}
              onCardClick={(folderId: string, promptId: string, isOrgFolder: boolean) => setSelectedPrompt(promptId)}
              selected={prompt.id === selectedPrompt}
            />
          )
        })}
      </div>
      {error.length > 0 ? (
        <div className="error">{error}</div>
      ) : null}

      <div style={{ marginTop: "1rem", width: "100%", justifyContent: "flex-end", display: "flex" }}>
        <Button
          variant="contained"
          onClick={() => {
            setError("");
            //check that all required fields are filled out
            if (!selectedPrompt) {
              setError("Select prompt");
            }
            else {
              returnPrompt(selectedPrompt);
            }
          }}
          disabled={!selectedPrompt}
        >
          Ask Papyrus
        </Button>
      </div>
    </div>
  ) : (
    //Return nothing when we don't have prompts
    <div></div>
  )
}