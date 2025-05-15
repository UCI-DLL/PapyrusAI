import { ChangeEvent, useState } from "react";
import {
  Button,
  TextField,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { pdfjs } from 'react-pdf';
import { removeSpecialCharacters } from "../../utility/Helpers";


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