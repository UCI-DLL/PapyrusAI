import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { UserContext } from "../../utility/context/UserContext";
import { postCreateItem } from "../../utility/endpoints/ItemEndpoints";
import Post from "../../utility/Post";
import { AlertContext } from "../../utility/context/AlertContext";
import { Folder, Plus } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import ListFolderItems from "./ListFolderItems";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";


export default function Library(): JSX.Element {
  let navigator = useNavigate();
  const location = useLocation();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const [folderId, setFolderId] = useState(location.pathname.split("/")[2]);
  const [activeTab, setActiveTab] = useState<"my" | "shared">("my");
  const [openCreateFolderModal, setOpenCreateFolderModal] =
    useState<boolean>(false);
  const [listKey, setListKey] = useState(0);
  const [newFolder, setNewFolder] = useState<{
    name: string,
    description: string,
    type: string,
    parentId: string,
    ownerType: string | undefined,
    metadata: any
  }>({
    name: "",
    description: "",
    type: "folder",
    parentId: "root",
    ownerType: user?.username,
    metadata: { createdBy: user?.username }
  });

  useEffect(() => {
    setAlert({ message: "", type: "info" });

    Post(logEvent(), {
      eventType: "view_page",
      metadata: { page: "library" },
    });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const id = location.pathname.split("/")[2];
    setFolderId(id);
    if (id) setActiveTab("my"); // reset to My Library when entering a subfolder
  }, [location])

  function handleCreateFolder() {
    Post(postCreateItem(), newFolder, true).then((res) => {
      if (res.status && res.status < 300) {
        setListKey((k) => k + 1);
        setAlert({ message: t("library.folderCreated"), type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({
          message: t("library.folderCouldNotBeCreated"),
          type: "error",
        });
      }
      setOpenCreateFolderModal(false);
      setNewFolder({
        name: "",
        description: "",
        type: "folder",
        parentId: "root",
        ownerType: user?.username,
        metadata: { createdBy: user?.username }
      });
    });
  }

  return (
    <div className="min-h-screen">
      <DialogWrapper
        open={openCreateFolderModal}
        onOpenChange={setOpenCreateFolderModal}
        title={t("library.newFolder")}
        description={t("library.newFolderDescription")}
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenCreateFolderModal(false),
            variant: "outline",
          },
          {
            label: t("library.createFolder"),
            onClick: handleCreateFolder,
            disabled: !newFolder.name.trim(),
          },
        ]}
      >
        <div className="space-y-2">
          <Label htmlFor="folder-name">{t("library.folderName")}</Label>
          <Input
            id="folder-name"
            aria-label={t("library.folderName")}
            name="foldername"
            placeholder={t("library.enterFolderName")}
            value={newFolder.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewFolder((prev: any) => ({ ...prev, name: e.target.value }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolder.name.trim()) {
                handleCreateFolder();
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="folder-description">{t("library.folderDescription")}</Label>
          <Input
            id="folder-description"
            aria-label={t("library.folderDescription")}
            name="folderdescription"
            placeholder={t("library.enterFolderDescription")}
            value={newFolder.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewFolder((prev: any) => ({ ...prev, description: e.target.value }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateFolder();
              }
            }}
          />
        </div>
      </DialogWrapper>

      <div className="mx-auto px-4 py-6 ">
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
                    {t("library.library")}
                  </h1>
                </div>
                <nav
                  className="flex flex-col sm:flex-row gap-2"
                  aria-label={`${t("library.library")} ${t("common.actions")}}`}
                >
                  {user?.groups.includes(
                    process.env.REACT_APP_INSTRUCTOR
                      ? process.env.REACT_APP_INSTRUCTOR
                      : "PapyrusAIInstructors"
                  ) && (
                      <Button
                        variant="default"
                        onClick={() => setOpenCreateFolderModal(true)}
                        className="flex items-center gap-2"
                        aria-label={t("library.newFolder")}
                      >
                        <Folder className="h-4 w-4" aria-hidden="true" />
                        {t("library.newFolder")}
                      </Button>
                    )}
                  {/* Note: don't allow user's create anything other than a folder at the root (at least on the frontend) */}
                  {user?.groups.includes(
                    process.env.REACT_APP_INSTRUCTOR
                      ? process.env.REACT_APP_INSTRUCTOR
                      : "PapyrusAIInstructors"
                  ) && folderId && (
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
                            onClick: () => navigator(`/library/${folderId}/createprompt`),
                          },
                          {
                            label: t("library.addFile"),
                            onClick: () => navigator(`/library/${folderId}/createfile`),
                          },
                          {
                            label: t("library.addRubric"),
                            onClick: () => navigator(`/library/${folderId}/createrubric`),
                          },
                        ]}
                        align="end"
                      />
                    )}
                </nav>
              </div>
              <InfoAccordion>
                <p className="text-muted-foreground max-w-2xl text-base leading-6">
                  {t("library.libraryDescription")}&nbsp;
                  <a
                    href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.i0aofs3p0aio"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold transition-colors duration-200"
                  >
                    {t("library.libraryDescriptionLinkText")}
                  </a>
                  .
                </p>
              </InfoAccordion>
            </div>
          </div>
        </header>

        {/* Tab switcher — only visible at the root level */}
        {!folderId && (
          <div className="flex gap-1 mb-4 border-b" role="tablist" aria-label={t("library.library")}>
            <button
              role="tab"
              aria-selected={activeTab === "my"}
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "my"
                ? "border-primary text-primary dark:text-gold colorful-dark:text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {t("library.myLibrary")}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "shared"}
              onClick={() => setActiveTab("shared")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === "shared"
                ? "border-primary text-primary dark:text-gold colorful-dark:text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {t("library.sharedWithMe")}
            </button>
          </div>
        )}

        <ListFolderItems
          key={`${listKey}-${activeTab}`}
          folderId={folderId ?? "root"}
          shared={activeTab === "shared" && !folderId}
        />

      </div>
    </div>
  );
}
