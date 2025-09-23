import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { FolderType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { UserContext } from "../../utility/context/UserContext";
import {
  getOrgFolder,
  getUserFolder,
} from "../../utility/endpoints/FolderEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Plus, MessageSquare, FileText, Folder, Loader2 } from "lucide-react";
import ListFolderContents from "./ListFolderContents";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export default function ViewFolder(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folder, setFolder] = useState<FolderType>();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "library" &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[2] !== "org"
    ) {
      //get user folder data
      getFolder(false, location.pathname.split("/")[2], controller.signal);
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "library" &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[2] === "org" &&
      location.pathname.split("/")[3]
    ) {
      //get org folder
      getFolder(true, location.pathname.split("/")[3], controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function getFolder(isOrg: boolean, folderId: string, signal: AbortSignal) {
    if (!isOrg) {
      Get(getUserFolder(folderId), signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFolder(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/library");
            setAlert({
              message: "Folder Does Not Exist",
              type: "error",
            });
            setIsLoading(false);
          }
        }
      });
    } else {
      Get(getOrgFolder(folderId), signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFolder(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            // navigator("/library");
            setAlert({
              message: "Folder Does Not Exist",
              type: "error",
            });
            setIsLoading(false);
          }
        }
      });
    }
  }

  const getTotalItems = () => {
    if (!folder) return 0;
    return (folder.prompts?.length || 0) + (folder.files?.length || 0);
  };

  const getPromptCount = () => {
    return folder?.prompts?.length || 0;
  };

  const getFileCount = () => {
    return folder?.files?.length || 0;
  };

  return !isLoading && folder ? (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto px-6 py-8">
        <header className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg mb-8">
            <div
              className="absolute top-0 right-0 w-48 h-48 opacity-10"
              aria-hidden="true"
            >
              <Folder size={192} className="text-primary" />
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                {folder?.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl text-base leading-6">
                To create a custom prompt or upload a document, click "Add
                Content" below.
              </p>
            </div>
          </div>
        </header>

        <section aria-labelledby="folder-management-heading">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 id="folder-management-heading" className="text-2xl font-bold text-foreground mb-1">
                Content Management
              </h2>
              <p className="text-muted-foreground text-sm">
                Manage prompts and files within this folder.
              </p>
            </div>
            <nav className="flex flex-col md:flex-row gap-2" role="toolbar" aria-label="Content management actions">
              {user?.groups.includes(
                process.env.REACT_APP_INSTRUCTOR
                  ? process.env.REACT_APP_INSTRUCTOR
                  : "PapyrusAIInstructors"
              ) && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="default"
                      className="flex items-center gap-2"
                      aria-label="Add new content to folder"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add Content
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        className="justify-start flex items-center gap-2 h-auto p-3"
                        onClick={() => {
                          const basePath =
                            location.pathname.split("/")[2] !== "org"
                              ? `/library/${folder.id}/createprompt`
                              : `/library/org/${folder.id}/createprompt`;
                          navigator(basePath);
                        }}
                        aria-label="Create new prompt"
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        <div className="text-left">
                          <div className="font-medium">Add Prompt</div>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start flex items-center gap-2 h-auto p-3"
                        onClick={() => {
                          const basePath =
                            location.pathname.split("/")[2] !== "org"
                              ? `/library/${folder.id}/createfile`
                              : `/library/org/${folder.id}/createfile`;
                          navigator(basePath);
                        }}
                        aria-label="Upload new file"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        <div className="text-left">
                          <div className="font-medium">Add File</div>
                        </div>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </nav>
          </header>

          <div className="flex gap-2 mb-6" role="tablist" aria-label="Content filter tabs">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === "all"}
              aria-controls="folder-content"
            >
              <Folder className="h-4 w-4" aria-hidden="true" />
              All Items ({getTotalItems()})
            </Button>
            <Button
              variant={activeTab === "prompts" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("prompts")}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === "prompts"}
              aria-controls="folder-content"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Prompts ({getPromptCount()})
            </Button>
            <Button
              variant={activeTab === "files" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("files")}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === "files"}
              aria-controls="folder-content"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Files ({getFileCount()})
            </Button>
          </div>

          <div id="folder-content" role="tabpanel">
            <ListFolderContents
              folderId={folder.id}
              isOrgFolder={location.pathname.split("/")[2] === "org"}
              activeTab={activeTab}
            />
          </div>
        </section>
      </div>
    </main>
  ) : (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">Loading folder...</p>
      </div>
    </div>
  );
}
