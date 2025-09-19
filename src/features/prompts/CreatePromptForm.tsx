import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import Post from "../../utility/Post";
import { postCreatePrompt } from "../../utility/endpoints/PromptEndpoints";
import { useNavigate } from "react-router";
import { cn } from "../../lib/utils";

/**
 * This form is to update user's missing data
 * Note: This is hard coded with only name and family_name 
 */

interface MissingUserInfoFormProps {
  closeForm: () => void,
}

export default function CreatePromptForm({
  closeForm
}: MissingUserInfoFormProps): JSX.Element {
  //New user information
  const [session, setSession] = useState<{
    name: string,
    prompt: string
  }>({
    name: "",
    prompt: ""
  });
  const [errors, setErrors] = useState<{
    name: string,
    prompt: string
  }>({
    name: "",
    prompt: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigator = useNavigate();


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Prompt name missing" }))
    } else if (session.prompt === "") {
      setErrors((prev) => ({ ...prev, prompt: "Prompt missing" }))
    } else {
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postCreatePrompt(), session).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //close modal if user data was updated
            setSession({ name: "", prompt: "" });
            closeForm();
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setErrors({ name: res.data, prompt: res.data })
        }
        // set is loading back 
        setIsLoading(false);
      })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Prompt Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Prompt Name *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter a descriptive name for your prompt"
              value={session.name}
              onChange={handleChange}
              disabled={isLoading}
              required
              className={cn(
                "transition-colors",
                errors.name && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Prompt *
            </Label>
            <Textarea
              id="prompt"
              name="prompt"
              placeholder="Enter your prompt text here..."
              value={session.prompt}
              onChange={handleChange}
              disabled={isLoading}
              required
              rows={6}
              className={cn(
                "transition-colors resize-none",
                errors.prompt && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.prompt && (
              <p className="text-sm text-destructive">{errors.prompt}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? "Creating..." : "Create Prompt"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}