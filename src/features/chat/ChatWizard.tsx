import { DocumentType, PromptType } from "../../utility/types/CourseTypes"
import { ChangeEvent, useState, useContext } from "react";
import {
  Button,
  TextField,
  FormLabel,
  Select,
  MenuItem,
  ListItemText,
  SelectChangeEvent
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Modal } from "../../components/Modal";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { AlertContext } from "../../utility/context/AlertContext";
import * as PDFJS from 'pdfjs-dist';
PDFJS.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


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
  documents: Array<DocumentType> | undefined;
  prompts: Array<PromptType> | undefined;
  returnDocsPrompt: (userDocs: Array<DocumentType & { document: string }>, selectedPrompt: string) => void;
  onlyPrompts?: (selectedPrompt: string) => void; //ask the user for only prompts
}

export default function ChatWizard({
  documents,
  prompts,
  returnDocsPrompt,
  onlyPrompts
}: ChatWizardProps): JSX.Element {
  //Need to save the index of the document just in case some documents are the same name
  const [documentModal, setDocumentModal] = useState<DocumentType & { index: number } | undefined>(undefined);
  const [userDocuments, setUserDocuments] = useState<Array<DocumentType & { document: string }>>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const { setAlert } = useContext(AlertContext);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }
    const file = e.target.files[0];
    //Get text based of the file type
    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (!evt?.target?.result) {
          return;
        }
        const { result } = evt.target;
        if (documentModal) {
          setUserDocuments((prev) => {
            let items = [...prev];
            items[documentModal.index] = {
              document: result as string,
              usageText: documentModal.usageText,
              documentType: documentModal.documentType
            }
            return items
          })
        }
      };
      reader.readAsBinaryString(file);
    } else if (file.type === "application/pdf") {
      const temp = URL.createObjectURL(file);
      const doc = PDFJS.getDocument(temp);
      const pdfDocument = await doc.promise;
      const page = await pdfDocument.getPage(1);
      const textContent = await page.getTextContent();
      const text = textContent["items"].reduce((result: any, item: any) => {
        return `${result} ${item["str"]}`
      }, "")
      if (documentModal) {
        setUserDocuments((prev) => {
          let items = [...prev];
          items[documentModal.index] = {
            document: text as string,
            usageText: documentModal.usageText,
            documentType: documentModal.documentType
          }
          return items
        })
      }

    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = function (evt) {
        if (!evt?.target?.result) {
          return;
        }
        const content = evt.target.result;
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        var text = doc.getFullText();
        if (documentModal) {
          setUserDocuments((prev) => {
            let items = [...prev];
            items[documentModal.index] = {
              document: text as string,
              usageText: documentModal.usageText,
              documentType: documentModal.documentType
            }
            return items
          })
        }
      };
    } else {
      setAlert({ message: "File is unsupported", type: "error" });
      setDocumentModal(undefined);
    }
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    //Update the document text based on the document index
    if (documentModal) {
      setUserDocuments((prev) => {
        let items = [...prev];
        items[documentModal.index] = {
          document: e.target.value,
          usageText: documentModal.usageText,
          documentType: documentModal.documentType
        }
        return items
      })
    }
  }

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedPrompt(event.target.value as string);
  };


  return documents && prompts ? (
    <div className="chat__wizard">
      <Modal
        isOpen={documentModal !== undefined}
        title={documentModal ? documentModal?.usageText + documentModal?.documentType : "Enter Document"}
        onRequestClose={() => setDocumentModal(undefined)}
        actions={
          <Button sx={{ width: "100%" }} variant="contained" onClick={() => setDocumentModal(undefined)}>
            Close
          </Button>
        }
      >
        <div className="chat__wizard__modal">
          <Button
            component="label"
            variant="outlined"
            fullWidth
            startIcon={<UploadFileIcon />}
          >
            Upload Txt, Docx, PDF
            <input type="file" accept=".docx, .txt, .pdf" hidden onChange={handleFileUpload} />
          </Button>
          <TextField
            name="name"
            label={documentModal ? documentModal?.usageText + documentModal?.documentType : "Enter document"}
            fullWidth
            sx={{ margin: ".5rem 0" }}
            multiline
            maxRows={6}
            value={documentModal && userDocuments[documentModal.index] && userDocuments[documentModal.index].document ? userDocuments[documentModal.index].document : ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </div>

      </Modal>
      {(documents.length > 0) && (
        <>
          <h6>Enter text or upload a file for each document required.</h6>
          {documents.length > 0 && documents.map((doc, index) => {
            return (
              <div key={index} style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignContent: "center" }}>
                <button onClick={() => setDocumentModal({ ...doc, index: index })}>
                  <TextField
                    name="name"
                    label={doc ? doc?.usageText + doc?.documentType : "Enter document"}
                    fullWidth
                    sx={{ margin: ".5rem 0" }}
                    value={userDocuments[index] && userDocuments[index].document ? userDocuments[index].document : ""}
                    InputLabelProps={{ shrink: true, "aria-readonly": true }}
                    inputProps={{ readOnly: true }}
                  />
                </button>
              </div>
            )
          })}
        </>
      )}


      <h6>Select prompt option.</h6>
      {prompts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignContent: "center" }}>
          <FormLabel>Module Prompts</FormLabel>
          {/* add dropdown to handle prompts  */}
          <Select
            labelId="wizard-prompt-select"
            id="wizard-prompt-select"
            value={selectedPrompt}
            onChange={handleSelectChange}
            MenuProps={MenuProps}
            fullWidth
          >
            {prompts.map((prompt, index) => (
              <MenuItem key={index} value={prompt.id}>
                <ListItemText primary={prompt.name} />
              </MenuItem>
            ))}
          </Select>
        </div>
      )}

      <div style={{ marginTop: "1rem", width: "100%", justifyContent: "flex-end", display: "flex" }}>
        <Button
          variant="contained"
          onClick={() => {
            if (onlyPrompts) {
              onlyPrompts(selectedPrompt)
            } else {
              returnDocsPrompt(userDocuments, selectedPrompt)
            }
          }}
        >
          Ask PapyrusAI
        </Button>
      </div>

    </div>
  ) : (
    //Return nothing when we don't have documents or prompts
    <div></div>
  )
}