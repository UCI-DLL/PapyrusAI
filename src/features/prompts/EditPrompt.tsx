import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Separator } from "../../components/ui/separator";
import Get from "../../utility/Get";
import Put from "../../utility/Put";
import { PromptType } from "../../utility/types/CourseTypes";
import { getPrompt, updatePrompt } from "../../utility/endpoints/PromptEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

type EditPromptType = {
  isDeleted: boolean,
  name: string,
  prompt: string,
}

export default function OldEditPrompt(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditPromptType>({
    name: "",
    prompt: "",
    isDeleted: false,
  });
  const [prevSession, setPrevSession] = useState<PromptType | undefined>();
  const [errors, setErrors] = useState<EditPromptType>({
    name: "",
    prompt: "",
    isDeleted: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);

  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing 
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "prompts" &&
      location.pathname.split("/")[2]
    ) {
      //get prev prompt data
      const promptId = location.pathname.split("/")[2];
      Get(getPrompt(promptId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //set prev prompt data
            setPrevSession(res.data);
            //also set session
            setSession({
              name: res.data.name,
              prompt: res.data.prompt,
              isDeleted: res.data.isDeleted,
            });
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/prompts");
            setAlert({ message: "Prompt Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Name missing" }))
    }
    else if (session.prompt === "") {
      setErrors((prev) => ({ ...prev, signUpCode: "Prompt missing" }))
    } else {
      //Update prompt
      if (prevSession) {
        // set is loading
        setIsLoading(true);
        // post data back
        Put(updatePrompt(prevSession.id), session).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data) {
              //redirect to prompt list
              navigator("/prompts");
              //pop up notifying user of creation
              setAlert({ message: "Prompt updated", type: "success" })
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // set errors
            setErrors({
              name: res.data,
              prompt: res.data,
              isDeleted: res.data,
            });
            setAlert({ message: res.data, type: "error" })
          }
          // set is loading back 
          setIsLoading(false);
        });

      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading prompt...</span>
      </div>
    );
  }

  if (!prevSession) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Prompt not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Edit {prevSession.name}</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigator(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Prompt Information</CardTitle>
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
                placeholder="Enter prompt name"
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
                <p
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="assertive"
                >{errors.name}</p>
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
                <p
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="assertive"
                >{errors.prompt}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="delete-prompt"
                aria-labelledby="deletePromptLabel"
                checked={session ? session.isDeleted : false}
                onCheckedChange={(checked) => {
                  setSession((prev) => ({
                    ...prev,
                    isDeleted: checked === true
                  }))
                }}
                disabled={isLoading}
              />
              <Label
                id="deletePromptLabel"
                htmlFor="delete-prompt"
                className="text-sm font-medium cursor-pointer"
              >
                Mark for deletion
              </Label>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}