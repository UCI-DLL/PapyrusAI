import { PromptType } from "../../utility/types/CourseTypes";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Card, CardContent } from "../../components/ui/card";
import { Wand2, RefreshCw } from "lucide-react";

interface ChatWizardProps {
  prompts: Array<PromptType> | undefined;
  onlyPrompts: (selectedPrompt: string) => void;
}

export default function RepeatingPromptWizard({
  prompts,
  onlyPrompts
}: ChatWizardProps): JSX.Element {
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");

  const handleSelectChange = (value: string) => {
    setSelectedPrompt(value);
  };

  return prompts && prompts.length > 0 ? (
    <Card className="border-0 shadow-none">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="repeating-prompt-select" className="text-xs text-muted-foreground">
              Module Prompts
            </Label>
            <Select value={selectedPrompt} onValueChange={handleSelectChange}>
              <SelectTrigger
                id="repeating-prompt-select"
                className="h-9"
              >
                <SelectValue placeholder="Select a prompt..." />
              </SelectTrigger>
              <SelectContent avoidCollisions={false} position="popper">
                {prompts.map((prompt, index) => (
                  <SelectItem key={index} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={() => onlyPrompts(selectedPrompt)}
            disabled={!selectedPrompt}
            className="mt-6"
          >
            <Wand2 className="mr-2 h-3 w-3" />
            Ask Papyrus
          </Button>
        </div>
      </CardContent>
    </Card>
  ) : <></>;
}