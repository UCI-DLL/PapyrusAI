import { PromptType } from "../../utility/types/CourseTypes"
import { useState } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  SelectChangeEvent
} from "@mui/material";


interface ChatWizardProps {
  prompts: Array<PromptType> | undefined;
  onlyPrompts: (selectedPrompt: string) => void; //ask the user for only prompts
}

export default function RepeatingPromptWizard({
  prompts,
  onlyPrompts
}: ChatWizardProps): JSX.Element {
  //Need to save the index of the document just in case some documents are the same name
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedPrompt(event.target.value as string);
  };


  return prompts ? (
    <div className="chat__wizard" style={{ padding: "0.3rem" }}>
      <div style={{ display: "flex", width: "100%", justifyContent: "center", alignContent: "center", alignItems: "center" }}>
        {prompts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignContent: "center", flexGrow: "1" }}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Module Prompts</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={selectedPrompt}
                onChange={handleSelectChange}
                label="Module Prompts"
              >
                {prompts.map((prompt, index) => (
                  <MenuItem key={index} value={prompt.id}>
                    <ListItemText primary={prompt.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        )}

        <div style={{marginLeft: "0.4rem"}}>
          <Button
            variant="contained"
            onClick={() => {
              onlyPrompts(selectedPrompt)
            }}
          >
            Ask PapyrusAI
          </Button>
        </div>
      </div>

    </div>
  ) : (
    //Return nothing when we don't have documents or prompts
    <div></div>
  )
}