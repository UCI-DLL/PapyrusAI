import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { LibraryItem } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import Patch from "../../utility/Patch";
import { Search, Loader2, Folder, Pencil, ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";
import { FolderComponent } from "../../components/Folder";
import { getItem, getItems, getItemPermissions, patchUpdateItem } from "../../utility/endpoints/ItemEndpoints";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import { UserStarred } from "../../utility/types/UserTypes";
import { useTranslation } from "../../hooks/useTranslation";
import { Prompt } from "../../components/Prompt";
import { File } from "../../components/File";
import { Rubric } from "../../components/Rubric";

export enum SortOptions {
  Default = "Default",
  NameAZ = "NameAZ",
  NameZA = "NameZA",
  DateUpdated = "DateUpdated",
  DateCreated = "DateCreated",
}

export enum OwnerTypeOptions {
  Any = "Any",
  "Private" = "Private",
  "Public" = "Public",
}

export enum StarredOptions {
  All = "All",
  Starred = "Starred",
  "Not Starred" = "Not Starred",
}

export enum typeOptions {
  All = "all",
  Folders = "folder",
  Prompts = "prompts",
  Files = "files",
  Rubrics = "rubrics"
}

interface ListFoldersProps {
  folderId: string;
  noShowMenu?: boolean;
  onClick?: (folderId: string, isOrgFolder: boolean) => void;
  disableFolderId?: string;
  compactGrid?: boolean;
  onSelectItem?: (item: LibraryItem) => void;
  selectedItemIds?: string[];
  onFolderNavigate?: (folderId: string) => void;
  shared?: boolean;
}

export default function ListFolderItems(props: ListFoldersProps): JSX.Element {
  let navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const fetchedPermissionsRef = useRef<Set<string>>(new Set());
  const pendingFetchCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folderData, setFolderData] = useState<LibraryItem | undefined>();
  const [openEditFolderModal, setOpenEditFolderModal] = useState(false);
  const [editFolderForm, setEditFolderForm] = useState({ name: "", description: "" });
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [itemList, setItemList] = useState<LibraryItem[]>([]);
  const [filteredItemList, setFilteredItemList] = useState<LibraryItem[]>([]);
  const [starred, setStarred] = useState<UserStarred | undefined>();
  const [filters, setFilters] = useState<{
    sort: SortOptions;
    type: typeOptions;
    starred: StarredOptions;
    owner: OwnerTypeOptions;
  }>({
    sort: SortOptions.Default,
    type: typeOptions.All,
    starred: StarredOptions.All,
    owner: OwnerTypeOptions.Any,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const controller = new AbortController();
    fetchedPermissionsRef.current = new Set();
    setIsLoading(true);
    setItemList([])
    setFilteredItemList([])
    setFolderData(undefined)
    setSearchTerm("")
    setFilters({ sort: SortOptions.Default, type: typeOptions.All, starred: StarredOptions.All, owner: OwnerTypeOptions.Any })
    if (!props.shared && props.folderId !== "root") {
      getFolderData(props.folderId, controller.signal)
    }
    setStarred(undefined)
    if (!props.shared && props.folderId === "root" && user?.username) {
      pendingFetchCountRef.current = 2;
      getFolderItems(null, controller.signal, user.username);
      getFolderItems(null, controller.signal, "ORG");
    } else {
      pendingFetchCountRef.current = 1;
      getFolderItems(null, controller.signal);
    }
    getStarred(controller.signal);

    return () => {
      controller.abort();
      fetchedPermissionsRef.current = new Set();
      pendingFetchCountRef.current = 0;
      setItemList([])
      setFilteredItemList([])
      setStarred(undefined)
      setFolderData(undefined)
      setFilters({ sort: SortOptions.Default, type: typeOptions.All, starred: StarredOptions.All, owner: OwnerTypeOptions.Any });
    };
    // eslint-disable-next-line
  }, [props.folderId]);

  useEffect(() => {
    handleFilter({ preventDefault: () => { } } as React.FormEvent);
    // eslint-disable-next-line
  }, [searchTerm, filters, starred, itemList]);

  useEffect(() => {
    if (!props.shared || itemList.length === 0 || !user?.username) return;

    const toFetch = itemList.filter(
      (item) => !fetchedPermissionsRef.current.has(item.itemId) && !item.userPermission
    );
    if (toFetch.length === 0) return;

    toFetch.forEach((item) => fetchedPermissionsRef.current.add(item.itemId));

    const controller = new AbortController();
    Promise.all(
      toFetch.map((item) =>
        Get(getItemPermissions(item.itemId), controller.signal, true).then((res) => ({
          itemId: item.itemId,
          res,
        }))
      )
    ).then((results) => {
      if (controller.signal.aborted) return;
      const permMap: Record<string, "viewer" | "editor"> = {};
      results.forEach(({ itemId, res }) => {
        if (res && res.status < 300 && Array.isArray(res.data)) {
          const entry = (res.data as Array<{ userId: string; permission: string }>)
            .find((p) => p.userId === user?.username);
          if (entry && (entry.permission === "viewer" || entry.permission === "editor")) {
            permMap[itemId] = entry.permission;
          }
        }
      });
      if (Object.keys(permMap).length > 0) {
        setItemList((prev) =>
          prev.map((item) =>
            permMap[item.itemId] ? { ...item, userPermission: permMap[item.itemId] } : item
          )
        );
      }
    });

    return () => controller.abort();
    // eslint-disable-next-line
  }, [itemList, props.shared, user?.username]);

  //get folder data
  function getFolderData(folderId: string, signal: AbortSignal) {
    Get(getItem(folderId), signal, true).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          setFolderData(res.data)
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res !== undefined) setIsLoading(false);
      }
    });
  }

  //get all items in the folder
  function getFolderItems(nextKey: string | null, signal: AbortSignal, owner?: string) {
    const params: Parameters<typeof getItems>[0] = props.shared
      ? { shared: true }
      : { parentId: props.folderId, ...(owner ? { owner } : {}) };
    if (nextKey) params.nextKey = nextKey;
    Get(getItems(params), signal, true).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.items && res.data.items.length > 0) {
          setItemList((prev) => {
            const seen = new Set(prev.map((item) => item.itemId));
            return [...prev, ...res.data.items.filter((item: LibraryItem) => !seen.has(item.itemId))];
          });
        }
        if (res.data?.nextKey) {
          getFolderItems(res.data.nextKey, signal, owner);
        } else {
          pendingFetchCountRef.current -= 1;
          if (pendingFetchCountRef.current <= 0) setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res !== undefined) {
          pendingFetchCountRef.current -= 1;
          if (pendingFetchCountRef.current <= 0) setIsLoading(false);
        }
      }
    });
  }

  function getStarred(signal: AbortSignal) {
    Get(getUserFavoritingData(), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          setStarred(res.data);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      }
    });
  }

  function refreshList() {
    setIsLoading(true);
    setItemList([]);
    setFilteredItemList([]);
    const controller = new AbortController();
    getFolderItems(null, controller.signal);
    getStarred(controller.signal);
  }

  function loading(isLoading: boolean = true) {
    setIsLoading(isLoading);
  }

  function handleEditFolder(e?: React.FormEvent) {
    e?.preventDefault();
    setIsEditLoading(true);
    Patch(patchUpdateItem(props.folderId), { name: editFolderForm.name, description: editFolderForm.description }, true).then((res) => {
      if (res && res.status && res.status < 300) {
        setFolderData((prev) => prev ? { ...prev, name: editFolderForm.name, description: editFolderForm.description } : prev);
        setAlert({ message: t("library.folderUpdated"), type: "success" });
      } else if (res?.status === 401) {
        navigator("/login");
      } else if (res?.status === 403) {
        setAlert({ message: res?.data?.message || t("library.folderCouldNotBeUpdated"), type: "error" });
      } else {
        setAlert({ message: res?.data?.message || t("library.folderCouldNotBeUpdated"), type: "error" });
      }
      setOpenEditFolderModal(false);
      setIsEditLoading(false);
    });
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    let filtered = [...itemList];

    // owner filter
    if (filters.owner === OwnerTypeOptions.Private) {
      filtered = filtered.filter((item) => item.ownerId !== "ORG");
    } else if (filters.owner === OwnerTypeOptions.Public) {
      filtered = filtered.filter((item) => item.ownerId === "ORG");
    }

    // starred filter
    if (filters.starred === StarredOptions.Starred) {
      filtered = filtered.filter((item) => isItemStarred(item, starred, props.shared));
    } else if (filters.starred === StarredOptions["Not Starred"]) {
      filtered = filtered.filter((item) => !isItemStarred(item, starred, props.shared));
    }

    // search
    if (searchTerm !== "") {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // type filter
    if (filters.type !== typeOptions.All) {
      const typeMap: Record<string, string> = { folder: "folder", prompts: "prompt", files: "file", rubrics: "rubric" };
      const targetType = typeMap[filters.type];
      if (targetType) filtered = filtered.filter((i) => i.type === targetType);
    }

    // sort with folders always pinned to top
    filtered = sortItems(filtered, filters.sort, starred);

    setFilteredItemList(filtered);
  }

  function handleResetFilters() {
    setSearchTerm("");
    setFilters({ sort: SortOptions.Default, type: typeOptions.All, starred: StarredOptions.All, owner: OwnerTypeOptions.Any });
  }

  function handleStarChange(itemId: string, type: "folder" | "prompt" | "file" | "rubric", parentId: string, isNowStarred: boolean) {
    setStarred((prev) => {
      if (!prev) return prev;
      if (type === "folder") {
        const folders = isNowStarred
          ? [...(prev.folders ?? []), { folderId: itemId }]
          : (prev.folders ?? []).filter((f) => f.folderId !== itemId);
        return { ...prev, folders };
      }
      if (type === "prompt") {
        const prompts = isNowStarred
          ? [...(prev.prompts ?? []), { promptId: itemId, folderId: parentId }]
          : (prev.prompts ?? []).filter((p) => !(p.promptId === itemId && p.folderId === parentId));
        return { ...prev, prompts };
      }
      if (type === "file") {
        const files = isNowStarred
          ? [...(prev.files ?? []), { fileId: itemId, folderId: parentId }]
          : (prev.files ?? []).filter((f) => !(f.fileId === itemId && f.folderId === parentId));
        return { ...prev, files };
      }
      if (type === "rubric") {
        const rubrics = isNowStarred
          ? [...(prev.rubrics ?? []), { rubricId: itemId }]
          : (prev.rubrics ?? []).filter((r) => r.rubricId !== itemId);
        return { ...prev, rubrics };
      }
      return prev;
    });
  }

  return !isLoading ? (
    <div className="space-y-6">
      {props.noShowMenu && !props.onSelectItem && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          {t("library.noAssetsAdded")}
          <br />
          <span className="italic text-sm"> {t("library.noAssetsAddedNote")}</span>
        </div>
      )}

      {/* Edit Folder Dialog */}
      {!props.shared && props.folderId !== "root" && (
        <DialogWrapper
          open={openEditFolderModal}
          onOpenChange={setOpenEditFolderModal}
          title={t("library.editFolder")}
          description={t("library.editFolderDescription")}
          contentClassName="sm:max-w-md"
          actions={[
            {
              label: t("common.cancel"),
              onClick: () => setOpenEditFolderModal(false),
              variant: "outline",
            },
            {
              label: t("common.save"),
              onClick: handleEditFolder,
              disabled: !editFolderForm.name.trim() || isEditLoading,
              type: "submit",
              form: "edit-folder-form",
            },
          ]}
        >
          <form id="edit-folder-form" onSubmit={handleEditFolder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">{t("library.folderName")}</Label>
              <Input
                id="edit-folder-name"
                aria-label={t("library.folderName")}
                name="editfoldername"
                placeholder={t("library.enterFolderName")}
                value={editFolderForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFolderForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-description">{t("library.folderDescription")}</Label>
              <Input
                id="edit-folder-description"
                aria-label={t("library.folderDescription")}
                name="editfolderdescription"
                placeholder={t("library.enterFolderDescription")}
                value={editFolderForm.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFolderForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </form>
        </DialogWrapper>
      )}

      {/* Search and Filter Section */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        {!props.shared && props.folderId !== "root" && folderData && (
          <div className="mb-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 -ml-2 h-8"
              aria-label={t("common.back")}
              onClick={() => {
                if (props.onFolderNavigate) {
                  props.onFolderNavigate(folderData.parentId);
                } else if (folderData.parentId === "root") {
                  navigator("/library");
                } else {
                  navigator(`/library/${folderData.parentId}`);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("common.back")}
            </Button>
          </div>
        )}
        {!props.shared && props.folderId !== "root" && folderData && (
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold">{folderData.name}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={t("library.editFolderName")}
              onClick={() => {
                setEditFolderForm({ name: folderData.name, description: folderData.description ?? "" });
                setOpenEditFolderModal(true);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}
        {folderData?.description && (
          <div className="flex flex-col sm:flex-row gap-4">
            <span className="text-sm text-muted-foreground">{folderData.description}</span>
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            placeholder={t("library.searchContent")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t("library.searchContent")}
          />
        </div>

        {/* Inline filter dropdowns */}
        <div className="flex flex-wrap gap-4 mt-3 items-end" role="group" aria-label={t("library.filters")}>
          {/* Sort */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t("library.sort")}</Label>
            <Select
              value={filters.sort}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, sort: v as SortOptions }))}
            >
              <SelectTrigger className="w-auto min-w-[140px] h-9 text-sm" aria-label={t("library.sort")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={SortOptions.Default}>{t("library.sortDefault")}</SelectItem>
                <SelectItem value={SortOptions.NameAZ}>{t("library.nameAZ")}</SelectItem>
                <SelectItem value={SortOptions.NameZA}>{t("library.nameZA")}</SelectItem>
                <SelectItem value={SortOptions.DateUpdated}>{t("library.dateUpdated")}</SelectItem>
                <SelectItem value={SortOptions.DateCreated}>{t("library.dateCreated")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t("library.type")}</Label>
            <Select
              value={filters.type}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, type: v as typeOptions }))}
            >
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-sm" aria-label={t("library.type")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={typeOptions.All}>{t("library.allItems")}</SelectItem>
                <SelectItem value={typeOptions.Folders}>{t("library.folders")}</SelectItem>
                <SelectItem value={typeOptions.Prompts}>{t("library.prompts")}</SelectItem>
                <SelectItem value={typeOptions.Files}>{t("library.files")}</SelectItem>
                <SelectItem value={typeOptions.Rubrics}>{t("library.rubric")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t("library.owner")}</Label>
            <Select
              value={filters.owner}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, owner: v as OwnerTypeOptions }))}
            >
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-sm" aria-label={t("library.owner")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={OwnerTypeOptions.Any}>{t("common.any")}</SelectItem>
                <SelectItem value={OwnerTypeOptions.Public}>{t("library.public")}</SelectItem>
                <SelectItem value={OwnerTypeOptions.Private}>{t("library.private")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Starred */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">{t("library.starred")}</Label>
            <Select
              value={filters.starred}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, starred: v as StarredOptions }))}
            >
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-sm" aria-label={t("library.starred")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={StarredOptions.All}>{t("common.all")}</SelectItem>
                <SelectItem value={StarredOptions.Starred}>{t("library.starred")}</SelectItem>
                <SelectItem value={StarredOptions["Not Starred"]}>{t("library.notStarred")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear */}
          {(filters.sort !== SortOptions.Default || filters.type !== typeOptions.All || filters.owner !== OwnerTypeOptions.Any || filters.starred !== StarredOptions.All || searchTerm !== "") && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 text-sm text-muted-foreground">
              {t("library.clearFilters")}
            </Button>
          )}
        </div>
      </div>

      {/* Folder Grid */}
      <div
        className={cn(
          "grid gap-6",
          props.compactGrid ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {filteredItemList.map((item: LibraryItem, i) => {
          if (props.disableFolderId && props.disableFolderId === item.itemId) {
            return null;
          }
          if (item.type === "prompt") {
            return (
              <Prompt
                key={item.itemId}
                item={item}
                keyy={`${i}`}
                refreshList={refreshList}
                loading={loading}
                noShowMenu={props.noShowMenu}
                onClick={props.onSelectItem
                  ? (_id, _type) => props.onSelectItem!(item)
                  : undefined}
                isStarred={isItemStarred(item, starred, props.shared)}
                isSelected={props.selectedItemIds?.includes(item.itemId) ?? false}
                onStarChange={handleStarChange}
                shared={props.shared}
              />
            );
          }
          if (item.type === "file") {
            return (
              <File
                key={item.itemId}
                item={item}
                keyy={`${i}`}
                refreshList={refreshList}
                loading={loading}
                noShowMenu={props.noShowMenu}
                onClick={props.onSelectItem
                  ? (_id, _type) => props.onSelectItem!(item)
                  : undefined}
                isStarred={isItemStarred(item, starred, props.shared)}
                isSelected={props.selectedItemIds?.includes(item.itemId) ?? false}
                onStarChange={handleStarChange}
                shared={props.shared}
              />
            );
          }
          if (item.type === "rubric") {
            return (
              <Rubric
                key={item.itemId}
                item={item}
                keyy={`${i}`}
                refreshList={refreshList}
                loading={loading}
                noShowMenu={props.noShowMenu}
                onClick={props.onSelectItem
                  ? (_folderId, _id, _isOrg, _type) => props.onSelectItem!(item)
                  : undefined}
                isStarred={isItemStarred(item, starred, props.shared)}
                isSelected={props.selectedItemIds?.includes(item.itemId) ?? false}
                onStarChange={handleStarChange}
                shared={props.shared}
              />
            );
          }
          if (item.type === "folder") {
            return (
              <FolderComponent
                key={item.itemId}
                item={item}
                displayName={item.name}
                onClick={() => props.onFolderNavigate
                  ? props.onFolderNavigate(item.itemId)
                  : navigator(`/library/${item.itemId}`)
                }
                keyy={`${i}`}
                refreshList={refreshList}
                loading={loading}
                isStarred={isItemStarred(item, starred, props.shared)}
                noShowMenu={props.noShowMenu}
                onStarChange={handleStarChange}
                shared={props.shared}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Empty State */}
      {filteredItemList.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg" role="status">
          <Folder className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">
            {props.shared && !searchTerm && filters.starred === StarredOptions.All
              ? t("library.noSharedItems")
              : t("library.noAssetsFound")}
          </p>
          <p className="text-sm">
            {searchTerm || filters.starred !== StarredOptions.All
              ? t("library.tryAdjustingSearchOrFilters")
              : props.shared
                ? t("library.noSharedItemsDescription")
                : t("library.createNewAsset")}
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{t("loadingMessage.folders")}</p>
    </div>
  );
}

function isItemStarred(item: LibraryItem, starred: UserStarred | undefined, shared?: boolean): boolean {
  if (!starred) return false;
  if (item.type === "folder") return starred.folders?.some((s) => s.folderId === item.itemId) ?? false;
  if (item.type === "prompt") {
    return starred.prompts?.some((p) =>
      p.promptId === item.itemId && (shared || !p.folderId || p.folderId === item.parentId)
    ) ?? false;
  }
  if (item.type === "file") {
    return starred.files?.some((f) =>
      f.fileId === item.itemId && (shared || !f.folderId || f.folderId === item.parentId)
    ) ?? false;
  }
  if (item.type === "rubric") {
    return starred.rubrics?.some((r) => r.rubricId === item.itemId) ?? false;
  }
  return false;
}

function sortItems(list: LibraryItem[], sort: SortOptions, starred: UserStarred | undefined): LibraryItem[] {
  const folders = list.filter((i) => i.type === "folder");
  const others = list.filter((i) => i.type !== "folder");

  const sortGroup = (group: LibraryItem[]): LibraryItem[] => {
    switch (sort) {
      case SortOptions.NameAZ:
        return [...group].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      case SortOptions.NameZA:
        return [...group].sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
      case SortOptions.DateUpdated:
        return [...group].sort((a, b) => b.updatedAt - a.updatedAt);
      case SortOptions.DateCreated:
        return [...group].sort((a, b) => b.createdAt - a.createdAt);
      default: // Default: starred org → unstarred org → starred user → unstarred user, then newest first
        return [...group].sort((a, b) => {
          const aOrg = a.ownerId === "ORG";
          const bOrg = b.ownerId === "ORG";
          const aStarred = isItemStarred(a, starred, true);
          const bStarred = isItemStarred(b, starred, true);
          const aRank = aOrg ? (aStarred ? 0 : 1) : (aStarred ? 2 : 3);
          const bRank = bOrg ? (bStarred ? 0 : 1) : (bStarred ? 2 : 3);
          if (aRank !== bRank) return aRank - bRank;
          return b.createdAt - a.createdAt;
        });
    }
  };

  return [...sortGroup(folders), ...sortGroup(others)];
}

export function orderFolderAscendingNameAndStarred(list: LibraryItem[], starred: Array<{ folderId: string }>) {
  return [...list].sort((a, b) => {
    const aF = starred.some((m) => m.folderId === a.itemId);
    const bF = starred.some((m) => m.folderId === b.itemId);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

export function orderFolderDescendingNameAndStarred(list: LibraryItem[], starred: Array<{ folderId: string }>) {
  return [...list].sort((a, b) => {
    const aF = starred.some((m) => m.folderId === a.itemId);
    const bF = starred.some((m) => m.folderId === b.itemId);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
  });
}

export function orderFolderOldestCreatedAndStarred(list: LibraryItem[], starred: Array<{ folderId: string }>) {
  return [...list].sort((a, b) => {
    const aF = starred.some((m) => m.folderId === a.itemId);
    const bF = starred.some((m) => m.folderId === b.itemId);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return a.createdAt - b.createdAt;
  });
}

export function orderFolderNewestCreatedAndStarred(list: LibraryItem[], starred: Array<{ folderId: string }>) {
  return [...list].sort((a, b) => {
    const aF = starred.some((m) => m.folderId === a.itemId);
    const bF = starred.some((m) => m.folderId === b.itemId);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return b.createdAt - a.createdAt;
  });
}
