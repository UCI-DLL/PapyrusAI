import { PromptType } from "../../utility/types/CourseTypes"
import { useState } from "react";
import {
  Button,
  Select,
  MenuItem,
  ListItemText,
  SelectChangeEvent
} from "@mui/material";


const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

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

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedPrompt(event.target.value as string);
  };

  return prompts && prompts.length > 0 ? (
    <div className="chat__wizard">
      <h6>Select prompt option</h6>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignContent: "center" }}>
        {/* add dropdown to handle prompts  */}
        <Select
          labelId="wizard-prompt-select"
          id="wizard-prompt-select"
          value={selectedPrompt}
          onChange={handleSelectChange}
          MenuProps={MenuProps}
          fullWidth
          required
        >
          {prompts.map((prompt, index) => (
            <MenuItem key={index} value={prompt.id}>
              <ListItemText primary={prompt.name} />
            </MenuItem>
          ))}
        </Select>
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