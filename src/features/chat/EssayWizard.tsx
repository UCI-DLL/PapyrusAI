import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { PenTool, Paperclip, Send } from "lucide-react";
import DocumentModal from "./DocumentModal";
import { PromptType } from "../../utility/types/CourseTypes";

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

  function returnDocText(docText: string) {
    setOpenDocumentModal(false);
    setEssay(docText);
  }

  const handleSelectChange = (value: string) => {
    setSelectedPrompt(value);
    setError("");
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (essay.length > 0) {
      setError("");
      if (prompts) {
        if (selectedPrompt) {
          returnEssay(essay, selectedPrompt);
        } else {
          setError("Please select a prompt to continue");
        }
      } else {
        returnEssay(essay);
      }
    } else {
      setError("Please enter your essay content");
    }
  }

  function handleEssayChange(value: string) {
    setError("");
    if (value.length < 100000) {
      setEssay(value);
    } else {
      setError("Essay is too long. Please keep it under 100,000 characters.");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <DialogWrapper
        open={openDocumentModal}
        onOpenChange={setOpenDocumentModal}
        title="Upload Document"
        description="Upload a document to use as your essay content"
        contentClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        showFooter={false}
      >
        <DocumentModal returnDocText={returnDocText} />
      </DialogWrapper>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Submit Your Essay
          </CardTitle>
          <CardDescription>
            Enter or upload your essay content to get feedback from the AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {prompts && prompts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="prompt-select">Select Prompt Option</Label>
              <Select value={selectedPrompt} onValueChange={handleSelectChange}>
                <SelectTrigger id="prompt-select">
                  <SelectValue placeholder="Choose the prompt for AI feedback..." />
                </SelectTrigger>
                <SelectContent>
                  {prompts.map((prompt, index) => (
                    <SelectItem key={index} value={prompt.id}>
                      {prompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select the prompt with which you would like to begin your
                conversation with the AI.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="essay-content">Essay Content</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDocumentModal(true)}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </div>
            <Textarea
              id="essay-content"
              placeholder="Enter your essay content here, or upload a document using the button above..."
              value={essay}
              onChange={(e) => handleEssayChange(e.target.value)}
              className="min-h-[200px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  setEssay((prev) => prev + "\n");
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              {essay.length.toLocaleString()} / 100,000 characters • Press
              Shift+Enter for new line, Enter to submit
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={essay.length < 1 || (prompts && !selectedPrompt)}
              className="min-w-[140px]"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Essay
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
