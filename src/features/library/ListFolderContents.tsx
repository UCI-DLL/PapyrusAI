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
import {
  FileType,
  FolderType,
  PromptType,
  RubricType,
  TagType,
} from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { Calendar } from "../../components/ui/calendar";
import {
  getOrgFolder,
  getUserFolder,
} from "../../utility/endpoints/FolderEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
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

export enum TypeOptions {
  All = "All",
  Prompt = "Prompt",
  File = "File",
  Rubric = "Rubric",
}

export enum StarredOptions {
  All = "All",
  Starred = "Starred",
  "Not Starred" = "Not Starred",
}

interface ListPromptsProps {
  folderId: string;
  isOrgFolder: boolean;
  noShowMenu?: boolean;
  onClick?: (
    folderId: string,
    id: string,
    isOrgFolder: boolean,
    type: string
  ) => void; //type is "prompt" or "file"
  activeTab?: string;
  compactGrid?: boolean;
  selectedPromptIds?: string[];
  selectedFileIds?: string[];
}

export default function ListFolderContents(
  props: ListPromptsProps
): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folder, setFolder] = useState<FolderType>();
  const [filteredFolder, setFilteredFolder] = useState<FolderType>();
  const [rubrics, setRubrics] = useState<RubricType[]>([]);
  const [filteredRubrics, setFilteredRubrics] = useState<RubricType[]>([]);
  const { setAlert } = useContext(AlertContext);
  const [starred, setStarred] = useState<UserStarred | undefined>();
  const [filters, setFilters] = useState<{
    search: string;
    sort: SortOptions;
    starred: StarredOptions;
    startDate: Date | undefined;
    endDate: Date | undefined;
    tags: string;
    type: TypeOptions;
  }>({
    search: "", //title of folder or title or contents of prompts
    sort: SortOptions.Newest, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
    starred: StarredOptions.All,
    startDate: undefined,
    endDate: undefined,
    tags: "none",
    type: TypeOptions.All,
  });
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] =
    useState<boolean>(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();
  //If safari, use a different dropdown within dialog modal so that screen readers can read
  const isSafari =
    typeof window !== "undefined" &&
    window.navigator.userAgent.includes("Safari") &&
    !window.navigator.userAgent.includes("Chrome") &&
    window.navigator.userAgent.includes("Mac OS");

  // Handle search filtering
  useEffect(() => {
    const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
    handleFilter(syntheticEvent);
    // eslint-disable-next-line
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    //get user folder data
    getFolder(props.isOrgFolder, props.folderId, controller.signal);
    loadRubrics(props.folderId);

    if (tagList.length === 0) {
      getTags("", controller.signal);
    }

    getStarred(controller.signal);

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (starred && folder) {
      //Default Sort by newest and starred
      //Only update the filtered folder since it is the only one shown to the user
      // and if you update folder, then it will create a loop
      setFilteredFolder((prev) => {
        if (prev) {
          const orderedPrev = { ...prev };
          orderedPrev.prompts = orderPromptNewestCreatedAndStarred(
            prev.prompts,
            starred && starred.prompts ? starred.prompts : []
          );
          orderedPrev.files = orderFileNewestCreatedAndStarred(
            prev.files,
            starred && starred.files ? starred.files : []
          );
          return orderedPrev;
        } else return prev;
      });
    }
    // eslint-disable-next-line
  }, [starred, folder]);

  // Filter based on activeTab
  useEffect(() => {
    if (folder && props.activeTab) {
      let filteredPrompts = folder.prompts;
      let filteredFiles = folder.files;

      if (props.activeTab === "prompts") {
        filteredFiles = [];
        setFilteredRubrics([]);
      } else if (props.activeTab === "files") {
        filteredPrompts = [];
        setFilteredRubrics([]);
      } else if (props.activeTab === "rubrics") {
        filteredPrompts = [];
        filteredFiles = [];
        setFilteredRubrics(rubrics);
      } else {
        // "all"
        setFilteredRubrics(rubrics);
      }

      setFilteredFolder((prev) =>
        prev ? { ...prev, prompts: filteredPrompts, files: filteredFiles } : prev
      );
    }
  }, [props.activeTab, folder, rubrics]);

  function getFolder(isOrg: boolean, folderId: string, signal: AbortSignal) {
    if (!isOrg) {
      Get(getUserFolder(folderId), signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFolder(res.data);
            setFilteredFolder(res.data);
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
              message: t("errorMessage.folderNotExist"),
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
            setFilteredFolder(res.data);
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
              message: t("errorMessage.folderNotExist"),
              type: "error",
            });
            setIsLoading(false);
          }
        }
      });
    }
  }

  function getTags(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getTagList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.tags && res.data.ScannedCount !== undefined) {
          //Get the list of all folders
          setTagList((prev) => [...prev, ...res.data.tags]);
          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getTags(res.data.LastEvaluatedKey.id, signal);
          } else {
            setIsLoading(false);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setIsLoading(false);
        }
      }
    });
  }

  function getStarred(signal: AbortSignal) {
    Get(getUserFavoritingData(), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          //get the list of all favorited for this specific user
          setStarred(res.data);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
        }
      }
    });
  }

  function loadRubrics(folderId: string) {
    const key = `rubrics_${folderId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return;
    try {
      const all: RubricType[] = JSON.parse(stored);
      const active = all.filter((r) => !r.isDeleted);
      setRubrics(active);
      setFilteredRubrics(active);
    } catch {
      // corrupt localStorage — ignore
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    if (!folder) return; //return if no folder
    if (!filteredFolder) return;

    var filteredPrompts = folder.prompts;
    var filteredFiles = folder.files;

    //handle asset type
    if (filters.type === TypeOptions.Prompt) {
      filteredFiles = [];
      setFilteredRubrics([]);
    } else if (filters.type === TypeOptions.File) {
      filteredPrompts = [];
      setFilteredRubrics([]);
    } else if (filters.type === TypeOptions.Rubric) {
      filteredFiles = [];
      filteredPrompts = [];
      setFilteredRubrics(
        searchTerm
          ? rubrics.filter((r) =>
              r.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : rubrics
      );
    } else {
      // TypeOptions.All — filter rubrics by search
      setFilteredRubrics(
        searchTerm
          ? rubrics.filter((r) =>
              r.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : rubrics
      );
    }

    //handle starred filter
    if ((filters.starred as string) === StarredOptions.All) {
      //Do nothing
    } else if (
      (filters.starred as string) === StarredOptions.Starred &&
      starred &&
      (starred.files || starred.prompts)
    ) {
      filteredFiles = filteredFiles.filter(
        (x: FileType) =>
          starred.files &&
          starred.files.some(
            (y) => y.fileId === x.id && y.folderId === folder.id
          )
      );
      filteredPrompts = filteredPrompts.filter(
        (x: PromptType) =>
          starred.prompts &&
          starred.prompts.some(
            (y) => y.promptId === x.id && y.folderId === folder.id
          )
      );
    } else if (
      (filters.starred as string) === StarredOptions["Not Starred"] &&
      starred &&
      (starred.files || starred.prompts)
    ) {
      filteredFiles = filteredFiles.filter(
        (x: FileType) =>
          starred.files && !starred.files.some((y) => y.fileId === x.id)
      );
      filteredPrompts = filteredPrompts.filter(
        (x: PromptType) =>
          starred.prompts && !starred.prompts.some((y) => y.promptId === x.id)
      );
    }

    //handle searching
    if (searchTerm !== "") {
      filteredPrompts = filteredPrompts.filter(
        (prompt: PromptType) =>
          prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
      filteredFiles = filteredFiles.filter((file: FileType) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    //handle tag
    if (filters.tags && filters.tags !== "none") {
      filteredPrompts = filteredPrompts.filter((prompt: PromptType) =>
        prompt.tags ? prompt.tags.includes(filters.tags) : prompt
      );
      filteredFiles = filteredFiles.filter((file: FileType) =>
        file.tags ? file.tags.includes(filters.tags) : file
      );
    }

    //handle date
    if (filters.startDate) {
      filteredPrompts = filteredPrompts.filter((prompt: PromptType) => {
        var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
        return filters.startDate ? date > filters.startDate : true;
      });
      filteredFiles = filteredFiles.filter((file: FileType) => {
        var date = new Date(parseInt(file.id.substring(0, 13), 10));
        return filters.startDate ? date > filters.startDate : true;
      });
    }
    if (filters.endDate) {
      filteredPrompts = filteredPrompts.filter((prompt: PromptType) => {
        var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
        return filters.endDate ? date < filters.endDate : true;
      });
      filteredFiles = filteredFiles.filter((file: FileType) => {
        var date = new Date(parseInt(file.id.substring(0, 13), 10));
        return filters.endDate ? date < filters.endDate : true;
      });
    }

    // handle sorting
    if ((filters.sort as string) === SortOptions.Ascending) {
      filteredPrompts = orderPromptAscendingNameAndStarred(
        filteredPrompts,
        starred && starred.prompts ? starred.prompts : []
      );
      filteredFiles = orderFileAscendingNameAndStarred(
        filteredFiles,
        starred && starred.files ? starred.files : []
      );
    } else if ((filters.sort as string) === SortOptions.Descending) {
      filteredPrompts = orderPromptDescendingNameAndStarred(
        filteredPrompts,
        starred && starred.prompts ? starred.prompts : []
      );
      filteredFiles = orderFileDescendingNameAndStarred(
        filteredFiles,
        starred && starred.files ? starred.files : []
      );
    } else if ((filters.sort as string) === SortOptions.Oldest) {
      filteredPrompts = orderPromptOldestCreatedAndStarred(
        filteredPrompts,
        starred && starred.prompts ? starred.prompts : []
      );
      filteredFiles = orderFileOldestCreatedAndStarred(
        filteredFiles,
        starred && starred.files ? starred.files : []
      );
    } else if ((filters.sort as string) === SortOptions.Newest) {
      filteredPrompts = orderPromptNewestCreatedAndStarred(
        filteredPrompts,
        starred && starred.prompts ? starred.prompts : []
      );
      filteredFiles = orderFileNewestCreatedAndStarred(
        filteredFiles,
        starred && starred.files ? starred.files : []
      );
    } else {
      //newest
      filteredPrompts = orderPromptNewestCreatedAndStarred(
        filteredPrompts,
        starred && starred.prompts ? starred.prompts : []
      );
      filteredFiles = orderFileNewestCreatedAndStarred(
        filteredFiles,
        starred && starred.files ? starred.files : []
      );
    }

    //finally set the filtered lists
    setFilteredFolder((prev) =>
      prev ? { ...prev, prompts: filteredPrompts, files: filteredFiles } : prev
    );
  }

  function handleResetFilters() {
    setSearchTerm("");
    setFilters({
      search: "", //title of folder or title or contents of prompts
      sort: SortOptions.Newest, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
      starred: StarredOptions.All,
      startDate: undefined,
      endDate: undefined,
      tags: "none",
      type: TypeOptions.All,
    });
    setFilteredFolder(folder);
  }

  function refreshList() {
    setIsLoading(true);
    setTagList([]);
    const controller = new AbortController();
    //get user folder data
    getFolder(props.isOrgFolder, props.folderId, controller.signal);
    getTags("", controller.signal);
    getStarred(controller.signal);
  }

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm !== "") count++;
    if (filters.type !== TypeOptions.All) count++;
    if (filters.starred !== StarredOptions.All) count++;
    if (filters.sort !== SortOptions.Newest) count++;
    if (filters.tags !== "none") count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  };

  return !isLoading && filteredFolder ? (
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
              {/* handle safari screen readers  */}
              {isSafari ? (
                <div className="space-y-2">
                  <Label>{t("library.type")}</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={filters.type}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: value.target.value as TypeOptions,
                      }))
                    }
                    title={t("library.type")}
                  >
                    <option value={"All"} key={"All"}>
                      {t("common.all")}
                    </option>
                    <option key={"Prompt"} value={"Prompt"}>
                      {t("common.prompt")}
                    </option>
                    <option key={"File"} value={"File"}>
                      {t("common.file")}
                    </option>
                    <option key={"Rubric"} value={"Rubric"}>
                      Rubric
                    </option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("library.type")}</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: value as TypeOptions,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} position="popper">
                      <SelectItem value={"All"} key={"All"}>
                        {t("common.all")}
                      </SelectItem>
                      <SelectItem key={"Prompt"} value={"Prompt"}>
                        {t("common.prompt")}
                      </SelectItem>
                      <SelectItem key={"File"} value={"File"}>
                        {t("common.file")}
                      </SelectItem>
                      <SelectItem key={"Rubric"} value={"Rubric"}>
                        Rubric
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* handle safari screen readers  */}
              {isSafari ? (
                <div className="space-y-2">
                  <Label>{t("library.sort")}</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={filters.sort}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        sort: value.target.value as SortOptions,
                      }))
                    }
                    title={t("library.sort")}
                  >

                    {Object.values(SortOptions).map((sort) => (
                      <option key={sort} value={sort}>
                        {t(`library.${sort.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("library.sort")}</Label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        sort: value as SortOptions,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} position="popper">
                      {Object.values(SortOptions).map((sort) => (
                        <SelectItem key={sort} value={sort}>
                          {t(`library.${sort.toLowerCase()}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* handle safari screen readers  */}
              {isSafari ? (
                <div className="space-y-2">
                  <Label>{t("library.starred")}</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={filters.starred}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        starred: value.target.value as StarredOptions,
                      }))
                    }
                    title={t("library.starred")}
                  >
                    <option value={"All"} key={"All"}>
                      {t("common.all")}
                    </option>
                    <option value={"Starred"} key={"Starred"}>
                      {t("library.starred")}
                    </option>
                    <option value={"Not Starred"} key={"Not Starred"}>
                      {t("library.notStarred")}
                    </option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("library.starred")}</Label>
                  <Select
                    value={filters.starred}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        starred: value as StarredOptions,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} position="popper">
                      <SelectItem value={"All"} key={"All"}>
                        {t("common.all")}
                      </SelectItem>
                      <SelectItem value={"Starred"} key={"Starred"}>
                        {t("library.starred")}
                      </SelectItem>
                      <SelectItem value={"Not Starred"} key={"Not Starred"}>
                        {t("library.notStarred")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* handle safari screen readers  */}
              {isSafari ? (
                <div className="space-y-2">
                  <Label>{t("library.tags")}</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 py-2 text-sm"
                    value={filters.tags}
                    onChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        tags: value.target.value,
                      }))
                    }
                    title={t("library.tags")}
                  >
                    <option value="none" key="none">
                      {t("library.noFilter")}
                    </option>
                    {tagList.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("library.tags")}</Label>
                  <Select
                    value={filters.tags}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        tags: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("library.tags")} />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} position="popper">
                      <SelectItem value="none" key="none">
                        {t("library.noFilter")}
                      </SelectItem>
                      {tagList.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.id}
                        </SelectItem>
                      ))}
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.startDate
                          ? format(filters.startDate, "PPP")
                          : t("library.pickStartDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => {
                          setFilters((prev) => ({
                            ...prev,
                            startDate: date,
                          }));
                          setStartDateOpen(false);
                        }}
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.endDate
                          ? format(filters.endDate, "PPP")
                          : t("library.pickEndDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => {
                          setFilters((prev) => ({
                            ...prev,
                            endDate: date,
                          }));
                          setEndDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex-1"
              >
                {t("library.clearFilters")}
              </Button>
              <Button
                onClick={(e) => {
                  setIsFilterPopoverOpen(false);
                  handleFilter(e);
                }}
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
        {/* Prompts */}
        {filteredFolder &&
          filteredFolder.prompts &&
          filteredFolder.prompts.map((prompt: PromptType, i) => (
            <Prompt
              key={`prompt-${i}`}
              prompt={prompt}
              folder={filteredFolder}
              keyy={`${i}`}
              refreshList={() => refreshList()}
              loading={() => setIsLoading(true)}
              noShowMenu={props.noShowMenu}
              onClick={props.onClick}
              isStarred={
                starred &&
                starred.prompts &&
                starred.prompts.some((p) => p.promptId === prompt.id) &&
                starred.prompts.some((c) => c.folderId === props.folderId)
              }
              isSelected={props.selectedPromptIds?.includes(prompt.id) ?? false}
            />
          ))}

        {/* Files */}
        {filteredFolder &&
          filteredFolder.files &&
          filteredFolder.files.map((file: FileType, i) => (
            <File
              key={`file-${i}`}
              file={file}
              folder={filteredFolder}
              keyy={`${i}`}
              refreshList={() => refreshList()}
              loading={() => setIsLoading(true)}
              noShowMenu={props.noShowMenu}
              onClick={props.onClick}
              isStarred={
                starred &&
                starred.files &&
                starred.files.some((p) => p.fileId === file.id) &&
                starred.files.some((c) => c.folderId === props.folderId)
              }
              isSelected={props.selectedFileIds?.includes(file.id) ?? false}
            />
          ))}

        {/* Rubrics */}
        {filteredRubrics.map((rubric: RubricType, i) => (
          <Rubric
            key={`rubric-${i}`}
            rubric={rubric}
            folder={filteredFolder!}
            keyy={`${i}`}
            refreshList={() => loadRubrics(props.folderId)}
            loading={() => setIsLoading(true)}
            noShowMenu={props.noShowMenu}
            onClick={props.onClick}
            isSelected={false}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredFolder &&
        (!filteredFolder.prompts || filteredFolder.prompts.length === 0) &&
        (!filteredFolder.files || filteredFolder.files.length === 0) &&
        filteredRubrics.length === 0 && (
          <div
            className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
            role="status"
          >
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{t("library.noContent")}</p>
            <p className="text-sm">
              {t("library.getStarted")}
            </p>
          </div>
        )}
    </div>
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
        <p className="text-muted-foreground">{t("loadingMessage.content")}</p>
      </div>
    </div>
  );
}

export function orderFileAscendingNameAndStarred(
  list: Array<FileType>,
  starred: Array<{ fileId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.fileId === a.id);
    const bIsFavorite = starred.some((m) => m.fileId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by name
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

export function orderFileDescendingNameAndStarred(
  list: Array<FileType>,
  starred: Array<{ fileId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.fileId === a.id);
    const bIsFavorite = starred.some((m) => m.fileId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by name
    return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
  });
}

export function orderFileOldestCreatedAndStarred(
  list: Array<FileType>,
  starred: Array<{ fileId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.fileId === a.id);
    const bIsFavorite = starred.some((m) => m.fileId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by oldest
    return a.id > b.id ? 1 : -1;
  });
}

export function orderFileNewestCreatedAndStarred(
  list: Array<FileType>,
  starred: Array<{ fileId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.fileId === a.id);
    const bIsFavorite = starred.some((m) => m.fileId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by most recent
    return a.id < b.id ? 1 : -1;
  });
}

export function orderPromptAscendingNameAndStarred(
  list: Array<PromptType>,
  starred: Array<{ promptId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.promptId === a.id);
    const bIsFavorite = starred.some((m) => m.promptId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by name
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

export function orderPromptDescendingNameAndStarred(
  list: Array<PromptType>,
  starred: Array<{ promptId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.promptId === a.id);
    const bIsFavorite = starred.some((m) => m.promptId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by name
    return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
  });
}

export function orderPromptOldestCreatedAndStarred(
  list: Array<PromptType>,
  starred: Array<{ promptId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.promptId === a.id);
    const bIsFavorite = starred.some((m) => m.promptId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by oldest
    return a.id > b.id ? 1 : -1;
  });
}

export function orderPromptNewestCreatedAndStarred(
  list: Array<PromptType>,
  starred: Array<{ promptId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.promptId === a.id);
    const bIsFavorite = starred.some((m) => m.promptId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by most recent
    return a.id < b.id ? 1 : -1;
  });
}
