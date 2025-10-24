import { ChangeEvent, useContext, useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Input } from "../../components/ui/input";
import { Upload, FileText, Loader2, Send } from "lucide-react";
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

  const [docText, setDocText] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useContext(UserContext);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      setError("Something went wrong");
      return;
    }
    setDocText("");
    setError("");
    setIsLoading(true);
    const file = e.target.files[0];

    try {
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
        setError("File is unsupported. Please upload TXT, PDF, or DOCX files only.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Error processing file. Please try again.");
      setIsLoading(false);
    }
  };

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDocText(removeSpecialCharacters(e.target.value));
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Upload the document or copy and paste the text (e.g., a rubric) that you would like to send to the AI. See the{" "}
            {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ? (
              <a
                href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:no-underline text-primary font-medium"
              >
                "Starting a Conversation" section of our user guide
              </a>
            ) : (
              <a
                href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:no-underline text-primary font-medium"
              >
                "Starting a Conversation" section of our user guide
              </a>
            )}
            {" "}for more information on when and why you might want to use documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="sr-only">Upload File</Label>
              <Button
                variant="outline"
                className="w-full h-20 border-dashed"
                disabled={isLoading}
                asChild
              >
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {isLoading ? "Processing..." : "Upload TXT, DOCX, PDF"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click to browse files
                  </span>
                </label>
              </Button>
              <Input
                id="file-upload"
                type="file"
                accept=".docx,.txt,.pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-text">Document Text</Label>
              <Textarea
                id="document-text"
                name="doctext"
                placeholder="Document content will appear here, or you can paste text directly..."
                className="min-h-[120px] resize-none"
                value={docText}
                onChange={handleChange}
                disabled={isLoading}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              className="w-full"
              onClick={() => {
                returnDocText(docText);
                setDocText("");
                setError("");
              }}
              disabled={isLoading || !docText.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}