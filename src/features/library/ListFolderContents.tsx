import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { LibraryItem } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { Calendar } from "../../components/ui/calendar";
import { getItems } from "../../utility/endpoints/ItemEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { Prompt } from "../../components/Prompt";
import { File } from "../../components/File";
import { Rubric } from "../../components/Rubric";
import { UserStarred } from "../../utility/types/UserTypes";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { Search, Filter, FileText } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export enum StarredOptions {
  All = "All",
  Starred = "Starred",
  "Not Starred" = "Not Starred",
}

interface ItemCounts {
  prompts: number;
  files: number;
  rubrics: number;
  folders: number;
}

interface ListFolderContentsProps {
  folderId: string;
  isOrgFolder: boolean;
  noShowMenu?: boolean;
  onClick?: (folderId: string, id: string, isOrgFolder: boolean, type: string) => void;
  activeTab?: string;
  compactGrid?: boolean;
  selectedPromptIds?: string[];
  selectedFileIds?: string[];
  onCountsChange?: (counts: ItemCounts) => void;
}

export default function ListFolderContents(props: ListFolderContentsProps): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);
  const { setAlert } = useContext(AlertContext);
  const [starred, setStarred] = useState<UserStarred | undefined>();
  const [filters, setFilters] = useState<{
    sort: SortOptions;
    starred: StarredOptions;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    sort: SortOptions.Newest,
    starred: StarredOptions.All,
    startDate: undefined,
    endDate: undefined,
  });
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();
  const isSafari =
    typeof window !== "undefined" &&
    window.navigator.userAgent.includes("Safari") &&
    !window.navigator.userAgent.includes("Chrome") &&
    window.navigator.userAgent.includes("Mac OS");

  useEffect(() => {
    handleFilter({ preventDefault: () => { } } as React.FormEvent);
    // eslint-disable-next-line
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    getContents(null, controller.signal);
    getStarred(controller.signal);
    return () => { controller.abort(); };
    // eslint-disable-next-line
  }, [props.folderId]);

  useEffect(() => {
    if (starred && items.length > 0) {
      setFilteredItems((prev) =>
        orderNewestAndStarred([...prev], starred)
      );
    }
    // eslint-disable-next-line
  }, [starred]);

  // Apply activeTab filter whenever tab or items change
  useEffect(() => {
    applyTabFilter(filteredItems, props.activeTab);
    // eslint-disable-next-line
  }, [props.activeTab]);

  function getContents(nextKey: string | null, signal: AbortSignal) {
    const params: Parameters<typeof getItems>[0] = { parentId: props.folderId };
    if (nextKey) params.nextKey = nextKey;
    Get(getItems(params), signal, true).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.items) {
          const newItems: LibraryItem[] = res.data.items;
          setItems((prev) => {
            const merged = [...prev, ...newItems];
            reportCounts(merged);
            return merged;
          });
          setFilteredItems((prev) => [...prev, ...newItems]);
          if (res.data.nextKey) {
            getContents(res.data.nextKey, signal);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res !== undefined) {
          setAlert({ message: t("errorMessage.folderNotExist"), type: "error" });
          setIsLoading(false);
        }
      }
    });
  }

  function getStarred(signal: AbortSignal) {
    Get(getUserFavoritingData(), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) setStarred(res.data);
      } else if (res && res.status === 401) {
        navigator("/login");
      }
    });
  }

  function reportCounts(list: LibraryItem[]) {
    if (!props.onCountsChange) return;
    const counts: ItemCounts = { prompts: 0, files: 0, rubrics: 0, folders: 0 };
    for (const item of list) {
      if (item.type === "prompt") counts.prompts++;
      else if (item.type === "file") counts.files++;
      else if (item.type === "rubric") counts.rubrics++;
      else if (item.type === "folder") counts.folders++;
    }
    props.onCountsChange(counts);
  }

  function isPromptStarred(item: LibraryItem): boolean {
    return starred?.prompts?.some(
      (p) => p.promptId === item.itemId && p.folderId === item.parentId
    ) ?? false;
  }

  function isFileStarred(item: LibraryItem): boolean {
    return starred?.files?.some(
      (f) => f.fileId === item.itemId && f.folderId === item.parentId
    ) ?? false;
  }

  function applyTabFilter(list: LibraryItem[], tab?: string) {
    if (!tab || tab === "all") {
      setFilteredItems(list);
    } else {
      const typeMap: Record<string, string> = {
        prompts: "prompt",
        files: "file",
        rubrics: "rubric",
        folders: "folder",
      };
      const targetType = typeMap[tab];
      setFilteredItems(targetType ? list.filter((i) => i.type === targetType) : list);
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    let filtered = [...items];

    // starred filter
    if ((filters.starred as string) === StarredOptions.Starred && starred) {
      filtered = filtered.filter((item) => {
        if (item.type === "prompt") return isPromptStarred(item);
        if (item.type === "file") return isFileStarred(item);
        return false;
      });
    } else if ((filters.starred as string) === StarredOptions["Not Starred"] && starred) {
      filtered = filtered.filter((item) => {
        if (item.type === "prompt") return !isPromptStarred(item);
        if (item.type === "file") return !isFileStarred(item);
        return true;
      });
    }

    // search
    if (searchTerm !== "") {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type === "prompt" &&
          (item.metadata?.prompt ?? "").toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // date filter
    if (filters.startDate) {
      filtered = filtered.filter((item) => new Date(item.createdAt) > filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter((item) => new Date(item.createdAt) < filters.endDate!);
    }

    // sort
    if ((filters.sort as string) === SortOptions.Ascending) {
      filtered = orderAscendingAndStarred(filtered, starred);
    } else if ((filters.sort as string) === SortOptions.Descending) {
      filtered = orderDescendingAndStarred(filtered, starred);
    } else if ((filters.sort as string) === SortOptions.Oldest) {
      filtered = orderOldestAndStarred(filtered, starred);
    } else {
      filtered = orderNewestAndStarred(filtered, starred);
    }

    applyTabFilter(filtered, props.activeTab);
  }

  function handleResetFilters() {
    setSearchTerm("");
    setFilters({ sort: SortOptions.Newest, starred: StarredOptions.All, startDate: undefined, endDate: undefined });
    applyTabFilter(items, props.activeTab);
  }

  function refreshList() {
    setIsLoading(true);
    setItems([]);
    setFilteredItems([]);
    const controller = new AbortController();
    getContents(null, controller.signal);
    getStarred(controller.signal);
  }

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm !== "") count++;
    if (filters.starred !== StarredOptions.All) count++;
    if (filters.sort !== SortOptions.Newest) count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  };

  return !isLoading ? (
    <div>
      {/* Search and Filter Section */}
      <div className="bg-card rounded-xl border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("library.searchContent")}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsFilterPopoverOpen(true)}
          >
            <Filter className="h-4 w-4" />
            {t("library.filters")}
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          <DialogWrapper
            open={isFilterPopoverOpen}
            onOpenChange={setIsFilterPopoverOpen}
            title={t("library.filters")}
            description={t("library.filtersDescription")}
            contentClassName="sm:max-w-xl"
            showFooter={false}
          >
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {isSafari ? (
                <div className="space-y-2">
                  <Label>{t("library.sort")}</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={filters.sort}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as SortOptions }))}
                    title={t("library.sort")}
                  >
                    {Object.values(SortOptions).map((sort) => (
                      <option key={sort} value={sort}>{t(`library.${sort.toLowerCase()}`)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("library.sort")}</Label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value as SortOptions }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent avoidCollisions={false} position="popper">
                      {Object.values(SortOptions).map((sort) => (
                        <SelectItem key={sort} value={sort}>{t(`library.${sort.toLowerCase()}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isSafari ? (
                <div className="space-y-2">
                  <Label>{t("library.starred")}</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={filters.starred}
                    onChange={(e) => setFilters((prev) => ({ ...prev, starred: e.target.value as StarredOptions }))}
                    title={t("library.starred")}
                  >
                    <option value={"All"}>{t("common.all")}</option>
                    <option value={"Starred"}>{t("library.starred")}</option>
                    <option value={"Not Starred"}>{t("library.notStarred")}</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("library.starred")}</Label>
                  <Select
                    value={filters.starred}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, starred: value as StarredOptions }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent avoidCollisions={false} position="popper">
                      <SelectItem value={"All"}>{t("common.all")}</SelectItem>
                      <SelectItem value={"Starred"}>{t("library.starred")}</SelectItem>
                      <SelectItem value={"Not Starred"}>{t("library.notStarred")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-sm font-medium">{t("library.dateCreated")}</Label>

                <div className="space-y-2">
                  <Label htmlFor="start-date">{t("library.pickStartDate")}</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !filters.startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate ? format(filters.startDate, "PPP") : t("library.pickStartDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => { setFilters((prev) => ({ ...prev, startDate: date })); setStartDateOpen(false); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">{t("library.pickEndDate")}</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !filters.endDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate ? format(filters.endDate, "PPP") : t("library.pickEndDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => { setFilters((prev) => ({ ...prev, endDate: date })); setEndDateOpen(false); }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleResetFilters} className="flex-1">
                {t("library.clearFilters")}
              </Button>
              <Button
                onClick={(e) => { setIsFilterPopoverOpen(false); handleFilter(e); }}
                className="flex-1"
              >
                {t("library.applyFilters")}
              </Button>
            </div>
          </DialogWrapper>
        </div>
      </div>

      {/* Content Grid */}
      <div
        className={cn(
          "grid gap-6",
          props.compactGrid
            ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {filteredItems.map((item: LibraryItem, i) => {
          if (item.type === "prompt") {
            return (
              <Prompt
                key={item.itemId}
                item={item}
                keyy={`${i}`}
                refreshList={refreshList}
                loading={() => setIsLoading(true)}
                noShowMenu={props.noShowMenu}
                onClick={props.onClick}
                isStarred={isPromptStarred(item)}
                isSelected={props.selectedPromptIds?.includes(item.itemId) ?? false}
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
                loading={() => setIsLoading(true)}
                noShowMenu={props.noShowMenu}
                onClick={props.onClick}
                isStarred={isFileStarred(item)}
                isSelected={props.selectedFileIds?.includes(item.itemId) ?? false}
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
                loading={() => setIsLoading(true)}
                noShowMenu={props.noShowMenu}
                onClick={props.onClick}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg" role="status">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">{t("library.noContent")}</p>
          <p className="text-sm">{t("library.getStarted")}</p>
        </div>
      )}
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-muted-foreground">{t("loadingMessage.content")}</p>
      </div>
    </div>
  );
}

function orderAscendingAndStarred(list: LibraryItem[], starred: UserStarred | undefined): LibraryItem[] {
  return [...list].sort((a, b) => {
    const aF = isItemStarred(a, starred);
    const bF = isItemStarred(b, starred);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

function orderDescendingAndStarred(list: LibraryItem[], starred: UserStarred | undefined): LibraryItem[] {
  return [...list].sort((a, b) => {
    const aF = isItemStarred(a, starred);
    const bF = isItemStarred(b, starred);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
  });
}

function orderOldestAndStarred(list: LibraryItem[], starred: UserStarred | undefined): LibraryItem[] {
  return [...list].sort((a, b) => {
    const aF = isItemStarred(a, starred);
    const bF = isItemStarred(b, starred);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return a.createdAt - b.createdAt;
  });
}

function orderNewestAndStarred(list: LibraryItem[], starred: UserStarred | undefined): LibraryItem[] {
  return [...list].sort((a, b) => {
    const aF = isItemStarred(a, starred);
    const bF = isItemStarred(b, starred);
    if (aF && !bF) return -1;
    if (!aF && bF) return 1;
    return b.createdAt - a.createdAt;
  });
}

function isItemStarred(item: LibraryItem, starred: UserStarred | undefined): boolean {
  if (!starred) return false;
  if (item.type === "prompt") {
    return starred.prompts?.some(
      (p) => p.promptId === item.itemId && p.folderId === item.parentId
    ) ?? false;
  }
  if (item.type === "file") {
    return starred.files?.some(
      (f) => f.fileId === item.itemId && f.folderId === item.parentId
    ) ?? false;
  }
  return false;
}
