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
import { UserStarred } from "../../utility/types/UserTypes";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { Search, Filter, FileText } from "lucide-react";

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
}

export default function ListFolderContents(
  props: ListPromptsProps
): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folder, setFolder] = useState<FolderType>();
  const [filteredFolder, setFilteredFolder] = useState<FolderType>();
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

  // Handle search filtering
  useEffect(() => {
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleFilter(syntheticEvent);
    // eslint-disable-next-line
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    //get user folder data
    getFolder(props.isOrgFolder, props.folderId, controller.signal);

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
      } else if (props.activeTab === "files") {
        filteredPrompts = [];
      }

      setFilteredFolder((prev) =>
        prev
          ? {
              ...prev,
              prompts: filteredPrompts,
              files: filteredFiles,
            }
          : prev
      );
    }
  }, [props.activeTab, folder]);

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
              message: "Folder Does Not Exist",
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

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    if (!folder) return; //return if no folder
    if (!filteredFolder) return;

    var filteredPrompts = folder.prompts;
    var filteredFiles = folder.files;

    //handle asset type
    if (filters.type === TypeOptions.Prompt) {
      filteredFiles = [];
    }
    if (filters.type === TypeOptions.File) {
      filteredPrompts = [];
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search content..."
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
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>

          <DialogWrapper
            open={isFilterPopoverOpen}
            onOpenChange={setIsFilterPopoverOpen}
            title="Filters"
            description="Filter content by various criteria"
            contentClassName="sm:max-w-xl"
            showFooter={false}
          >
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <Label>Type</Label>
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
                  <SelectContent>
                    {Object.values(TypeOptions).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort</Label>
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
                  <SelectContent>
                    {Object.values(SortOptions).map((sort) => (
                      <SelectItem key={sort} value={sort}>
                        {sort}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Starred</Label>
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
                  <SelectContent>
                    {Object.values(StarredOptions).map((starred) => (
                      <SelectItem key={starred} value={starred}>
                        {starred}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
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
                    <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" key="none">
                      No filter
                    </SelectItem>
                    {tagList.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Date Created</Label>

                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
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
                          : "Pick a start date"}
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
                  <Label htmlFor="end-date">End Date</Label>
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
                          : "Pick an end date"}
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
                Clear Filters
              </Button>
              <Button
                onClick={(e) => {
                  setIsFilterPopoverOpen(false);
                  handleFilter(e);
                }}
                className="flex-1"
              >
                Apply Filters
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
            />
          ))}
      </div>

      {/* Empty State */}
      {filteredFolder &&
        (!filteredFolder.prompts || filteredFolder.prompts.length === 0) &&
        (!filteredFolder.files || filteredFolder.files.length === 0) && (
          <div
            className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
            role="status"
          >
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No content found</p>
            <p className="text-sm">
              Get started by creating your first prompt or uploading a file.
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
        <p className="text-muted-foreground">Loading Content</p>
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
