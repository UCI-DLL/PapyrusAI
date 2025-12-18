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
import { useTranslation } from "../../hooks/useTranslation";

interface ChatWizardProps {
  prompts: Array<PromptType> | undefined;
  returnPrompt: (selectedPrompt: string) => void;
}

export default function ChatWizard({
  prompts,
  returnPrompt,
}: ChatWizardProps): JSX.Element {
  const { t } = useTranslation();
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
            {t("chat.selectPromptOption")}
          </CardTitle>
          <CardDescription>
            {t("chat.selectPromptOptionDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-select">{t("chat.availablePrompts")}</Label>
            <Select value={selectedPrompt} onValueChange={handleSelectChange}>
              <SelectTrigger id="prompt-select">
                <SelectValue placeholder={t("chat.selectPromptStarted")} />
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
                  setError(t("chat.selectPromptContinue"));
                } else {
                  returnPrompt(selectedPrompt);
                  setSelectedPrompt("");
                }
              }}
              disabled={!selectedPrompt}
              className="min-w-[140px]"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {t("chat.askPapyrus")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="p-4">
      <Alert>
        <AlertDescription>
          {t("chat.noPromptsInModule")}
        </AlertDescription>
      </Alert>
    </div>
  );
}