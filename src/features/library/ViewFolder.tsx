import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import { LibraryItem } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { UserContext } from "../../utility/context/UserContext";
import { getItem } from "../../utility/endpoints/ItemEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Plus, MessageSquare, FileText, Folder, Loader2, LayoutGrid } from "lucide-react";
import ListFolderContents from "./ListFolderContents";
import { useTranslation } from "../../hooks/useTranslation";
import Post from "../../utility/Post";
import { logEvent } from "../../utility/endpoints/UserEndpoints";

interface ItemCounts {
  prompts: number;
  files: number;
  rubrics: number;
  folders: number;
}

interface ViewFolderProps {
  folderId: string;
  noShowMenu?: boolean;
}

export default function ViewFolder(props: ViewFolderProps): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [folder, setFolder] = useState<LibraryItem>();
  const [itemCounts, setItemCounts] = useState<ItemCounts>({ prompts: 0, files: 0, rubrics: 0, folders: 0 });
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("all");

  const folderId = props.folderId;

  console.log("folderId", folderId)

  useEffect(() => {
    if (!folderId) return;
    const controller = new AbortController();
    setIsLoading(true);

    Get(getItem(folderId), controller.signal, true).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          setFolder(res.data);
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else if (res !== undefined) {
        setAlert({ message: t("library.folderDoesNotExist"), type: "error" });
        navigator("/library");
        setIsLoading(false);
      }
    });

    Post(logEvent(), {
      eventType: "view_page",
      metadata: { folderId, page: "view_folder" },
    });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [folderId]);

  const isOrgFolder = folder?.ownerId === "ORG";

  const getTotalItems = () =>
    itemCounts.prompts + itemCounts.files + itemCounts.rubrics + itemCounts.folders;

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
                    {folder.name}
                  </h1>
                </div>
                <nav
                  className="flex flex-col sm:flex-row gap-2"
                  aria-label={`${t("library.contentManagement")} ${t("common.actions")}}`}
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
                            aria-label={t("library.addContent")}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t("library.addContent")}
                          </Button>
                        }
                        actions={[
                          {
                            label: t("library.addPrompt"),
                            onClick: () => navigator(`/library/${folder.itemId}/createprompt`),
                          },
                          {
                            label: t("library.addFile"),
                            onClick: () => navigator(`/library/${folder.itemId}/createfile`),
                          },
                          {
                            label: t("library.addRubric"),
                            onClick: () => navigator(`/library/${folder.itemId}/createrubric`),
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
          className="flex gap-2 mb-6 flex-wrap"
          role="tablist"
          aria-label={t("library.contentFilterTabs")}
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
            {t("library.prompts")} ({itemCounts.prompts})
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
            {t("library.files")} ({itemCounts.files})
          </Button>
          <Button
            variant={activeTab === "rubrics" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("rubrics")}
            className="flex items-center gap-2"
            role="tab"
            aria-selected={activeTab === "rubrics"}
            aria-controls="folder-content"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            {t("library.rubrics")} ({itemCounts.rubrics})
          </Button>
        </div>

        <div id="folder-content" role="tabpanel">
          <ListFolderContents
            folderId={folder.itemId}
            isOrgFolder={isOrgFolder}
            activeTab={activeTab}
            onCountsChange={setItemCounts}
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
