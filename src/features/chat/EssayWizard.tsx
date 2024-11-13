import React, { useState } from "react";
import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Modal } from "../../components/Modal";
import DocumentModal from "./DocumentModal";

interface EssayWizardProps {
  returnEssay: (selectedPrompt: string) => void;
}

export default function EssayWizard({
  returnEssay,
}: EssayWizardProps): JSX.Element {
  const [essay, setEssay] = useState<string>("");
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (essay.length > 0) {
      setError("");
      returnEssay(essay)
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
          disabled={essay.length < 1}
        >
          Send Essay
        </Button>
      </div>
    </div>
  )
}