import { PromptType } from "../../utility/types/CourseTypes";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { MessageSquare, Wand2 } from "lucide-react";

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

  const handleSelectChange = (value: string) => {
    setSelectedPrompt(value);
    setError("");
  };

  return prompts && prompts.length > 0 ? (
    <div className="p-4 space-y-4">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Select Prompt Option
          </CardTitle>
          <CardDescription>
            Choose the prompt with which you would like to begin your conversation with the AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-select">Available Prompts</Label>
            <Select value={selectedPrompt} onValueChange={handleSelectChange}>
              <SelectTrigger id="prompt-select">
                <SelectValue placeholder="Select a prompt to get started..." />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt, index) => (
                  <SelectItem key={index} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => {
                setError("");
                if (!selectedPrompt) {
                  setError("Please select a prompt to continue");
                } else {
                  returnPrompt(selectedPrompt);
                  setSelectedPrompt("");
                }
              }}
              disabled={!selectedPrompt}
              className="min-w-[140px]"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Ask Papyrus
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="p-4">
      <Alert>
        <AlertDescription>
          No prompts are available for this module.
        </AlertDescription>
      </Alert>
    </div>
  );
}