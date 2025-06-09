import { ChangeEvent, useContext, useState } from "react";
import {
  Button,
  TextField,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { pdfjs } from 'react-pdf';
import { removeSpecialCharacters } from "../../utility/Helpers";
import { UserContext } from "../../utility/context/UserContext";


interface ChatWizardProps {
  returnDocText: (docText: string) => void;
}

export default function DocumentModal({
  returnDocText,
}: ChatWizardProps): JSX.Element {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  //Need to save the index of the document just in case some documents are the same name
  const [docText, setDocText] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useContext(UserContext); //current user signed in

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      setError("Something went wrong");
      return;
    }
    setDocText("");
    setIsLoading(true);
    const file = e.target.files[0];
    //Get text based of the file type
    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (!evt?.target?.result) {
          return;
        }
        const { result } = evt.target;
        setDocText(removeSpecialCharacters(result as string));
        setIsLoading(false);
      };
      reader.readAsBinaryString(file);
    } else if (file.type === "application/pdf") {
      const temp = URL.createObjectURL(file);
      const doc = pdfjs.getDocument(temp);
      const pdfDocument = await doc.promise;
      //handle multiple pages
      var numPages = pdfDocument.numPages;
      var currentPage = 1;
      while (currentPage <= numPages) {
        const page = await pdfDocument.getPage(currentPage);
        const textContent = await page.getTextContent();
        const text = textContent["items"].reduce((result: any, item: any) => {
          return `${result} ${item["str"]}`
        }, "")
        setDocText(prev => prev + removeSpecialCharacters(text as string));
        currentPage++
      }
      setIsLoading(false);
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
        setDocText(removeSpecialCharacters(text as string));
        setIsLoading(false);
      };
    } else {
      setError("File is unsupported");
      setIsLoading(false);
    }
  };

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDocText(removeSpecialCharacters(e.target.value));
  }

  return (
    <div className="chat__wizard">
      <div>
        Upload the document or copy and paste the text (e.g., a rubric) that you would like to send to the AI as part of the conversation. See the&nbsp;
        {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ? <a
          href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
          target="_blank" rel="noreferrer">“Starting a Conversation” section of our user guide
        </a> : (
          <a
            href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
            target="_blank" rel="noreferrer">“Starting a Conversation” section of our user guide
          </a>
        )}
        &nbsp;for more information on when and why you might want to use documents.
      </div>
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
          name="doctext"
          label={"Document"}
          autoFocus
          fullWidth
          sx={{ margin: ".5rem 0" }}
          multiline
          minRows={3}
          maxRows={6}
          value={docText}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          error={error !== ""}
          helperText={error}
          disabled={isLoading}
        />
        <div>
          <Button
            sx={{ width: "100%" }}
            variant="contained"
            onClick={() => {
              returnDocText(docText);
              setDocText("");
            }}
          >
            Submit Document
          </Button>
        </div>
      </div>
    </div>
  )
}