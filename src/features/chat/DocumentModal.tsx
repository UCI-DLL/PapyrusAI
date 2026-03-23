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
import { useTranslation } from "../../hooks/useTranslation";
import Post from "../../utility/Post";
import { logEvent } from "../../utility/endpoints/UserEndpoints";

interface ChatWizardProps {
  returnDocText: (docText: string) => void;
}

export default function DocumentModal({
  returnDocText,
}: ChatWizardProps): JSX.Element {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const { t } = useTranslation();
  const [docText, setDocText] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useContext(UserContext);
  const [docExt, setDocExt] = useState<string>("");

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      setError(t("errorMessage.genericError"));
      return;
    }
    setDocText("");
    setError("");
    setDocExt("");
    setIsLoading(true);
    const file = e.target.files[0];

    try {
      if (file.type === "text/plain") {
        setDocExt("txt")
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
        setDocExt("pdf")
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
        setDocExt("docx")
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
        setError(t("errorMessage.fileNotSupportedDoc"));
        setIsLoading(false);
      }
    } catch (err) {
      setError(t("errorMessage.processingFile"));
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
            {t("chat.uploadDocument")}
          </CardTitle>
          <CardDescription>
            {t("chat.uploadDocumentDescription")}
            {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ? (
              <a
                href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
              >
                {t("chat.conversationListDescriptionLinkText")}
              </a>
            ) : (
              <a
                href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
              >
                {t("chat.conversationListDescriptionLinkText")}
              </a>
            )}
            {t("chat.uploadDocumentDescription2")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="sr-only">{t("chat.uploadFile")}</Label>
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
                    <Upload className="h-6 w-6" />
                  )}
                  <span className="text-sm font-medium">
                    {isLoading ? t("loadingMessage.processing") : t("chat.uploadDocTypes")}
                  </span>
                  <span className="text-xs ">
                    {t("chat.clickBrowseFiles")}
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
              <Label htmlFor="document-text">{t("chat.docText")}</Label>
              <Textarea
                id="document-text"
                name="doctext"
                placeholder={t("chat.docTextPlaceholder")}
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
                //log action
                Post(logEvent(), {
                  eventType: "client_action",
                  metadata: {
                    action: "document_upload",
                    page: "chat",
                    docExt: docExt,
                    textLength: docText.length
                  }
                })
                returnDocText(docText);
                setDocText("");
                setError("");
              }}
              disabled={isLoading || !docText.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              {t("chat.submitDoc")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}