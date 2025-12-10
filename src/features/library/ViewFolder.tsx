import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
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
import { useTranslation } from "../../hooks/useTranslation";

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
  const { t } = useTranslation();
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
              message: t("library.folderDoesNotExist"),
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
              message: t("library.folderDoesNotExist"),
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
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                    {folder?.name}
                  </h1>
                </div>
                <nav
                  className="flex flex-col sm:flex-row gap-2"
                  aria-label="Content management actions"
                >
                  {user?.groups.includes(
                    process.env.REACT_APP_INSTRUCTOR
                      ? process.env.REACT_APP_INSTRUCTOR
                      : "PapyrusAIInstructors"
                  ) && (
                      <DropdownWrapper
                        trigger={
                          <Button
                            variant="default"
                            className="flex items-center gap-2"
                            aria-label="Add new content to folder"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t("library.addContent")}
                          </Button>
                        }
                        actions={[
                          {
                            label: t("library.addPrompt"),
                            onClick: () => {
                              const basePath =
                                location.pathname.split("/")[2] !== "org"
                                  ? `/library/${folder.id}/createprompt`
                                  : `/library/org/${folder.id}/createprompt`;
                              navigator(basePath);
                            },
                          },
                          {
                            label: t("library.addFile"),
                            onClick: () => {
                              const basePath =
                                location.pathname.split("/")[2] !== "org"
                                  ? `/library/${folder.id}/createfile`
                                  : `/library/org/${folder.id}/createfile`;
                              navigator(basePath);
                            },
                          },
                        ]}
                        align="end"
                      />
                    )}
                </nav>
              </div>
              <p className="text-muted-foreground max-w-2xl text-base leading-6">
                {t("library.addContentDescription")}
              </p>
            </div>
          </div>
        </header>

        <div
          className="flex gap-2 mb-6"
          role="tablist"
          aria-label="Content filter tabs"
        >
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
            {t("library.allItems")} ({getTotalItems()})
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
            {t("library.prompts")} ({getPromptCount()})
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
            {t("library.files")} ({getFileCount()})
          </Button>
        </div>

        <div id="folder-content" role="tabpanel">
          <ListFolderContents
            folderId={folder.id}
            isOrgFolder={location.pathname.split("/")[2] === "org"}
            activeTab={activeTab}
          />
        </div>
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
        <p className="text-muted-foreground">{t("library.loadingFolder")}</p>
      </div>
    </div>
  );
}
