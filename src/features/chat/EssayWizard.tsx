import React, { useState } from "react";
import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Modal } from "../../components/Modal";
import DocumentModal from "./DocumentModal";
import { PromptType } from "../../utility/types/CourseTypes";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

interface EssayWizardProps {
  prompts?: Array<PromptType> | undefined;
  returnEssay: (essay: string, returnMessage?: string) => void;
}

export default function EssayWizard({
  returnEssay,
  prompts,
}: EssayWizardProps): JSX.Element {
  const [essay, setEssay] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [error, setError] = useState("");
  const [openDocumentModal, setOpenDocumentModal] = useState<boolean>(false);
  //add file menu
  const [addAnchorEl, setAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const addOpen = Boolean(addAnchorEl);
  const handleAddClose = () => {
    setAddAnchorEl(null);
  };

  function returnDocText(docText: string) {
    setOpenDocumentModal(false);
    setEssay(docText)
  }

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedPrompt(event.target.value as string);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (essay.length > 0) {
      setError("");
      if (prompts) {
        if (selectedPrompt) {
          returnEssay(essay, selectedPrompt)
        } else {
          setError("Select a prompt")
        }
      } else {
        returnEssay(essay)
      }
    } else {
      setError("Essay Missing")
    }
  }

  return (
    <div className="chat__wizard">
      <Modal
        isOpen={openDocumentModal}
        title={"Document Upload"}
        onRequestClose={() => setOpenDocumentModal(false)}
        actions={
          <Button sx={{ width: "100%" }} variant="contained" color="secondary" onClick={() => setOpenDocumentModal(false)}>
            Cancel
          </Button>
        }
      >
        <DocumentModal returnDocText={returnDocText} />
      </Modal>
      {prompts ? (
        <div>
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
        </div>
      ) : <></>}
      <h6>Enter Essay</h6>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignContent: "center" }}>
        <form onSubmit={handleSubmit}>
          <FormControl sx={{ m: 1, width: '100%', margin: "0" }} variant="outlined">
            <InputLabel htmlFor="outlined-adornment-message">Send a message</InputLabel>
            <OutlinedInput
              id="outlined-adornment-message"
              label="Send a message"
              sx={{ width: "100%" }}
              value={essay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                //check that message length is less that 100000
                setError("");
                if (e.target.value.length < 100000) {
                  setEssay(e.target.value)
                } else {
                  setError("Message Too Long");
                }
              }}
              startAdornment={
                <>
                  <InputAdornment position="start">
                    <IconButton
                      aria-label="add file"
                      edge="start"
                      type="button"
                      id="add-button"
                      aria-controls={addOpen ? 'add-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={addOpen ? 'true' : undefined}
                      onClick={() => {
                        handleAddClose()
                        setOpenDocumentModal(true)
                      }}
                    >
                      {<AttachFileIcon />}
                    </IconButton>
                  </InputAdornment>
                </>
              }
              multiline
              maxRows={6}
              onKeyDown={(e: any) => {
                if (e.keyCode === 13 && e.shiftKey) {
                  e.preventDefault();
                  setEssay(prev => prev + "\n");
                } else if (e.keyCode === 13 && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </FormControl>
        </form>
      </div>
      {error.length > 0 ? (
        <div className="error">{error}</div>
      ) : null}

      <div style={{ marginTop: "1rem", width: "100%", justifyContent: "flex-end", display: "flex" }}>
        <Button
          variant="contained"
          type="submit"
          onClick={handleSubmit}
          disabled={essay.length < 1 || (prompts && !selectedPrompt)}
        //disabled if no essay OR if we have prompts but non selected
        >
          Send Essay
        </Button>
      </div>
    </div>
  )
}