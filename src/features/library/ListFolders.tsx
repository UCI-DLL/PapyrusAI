import React, { useEffect, useState } from "react";
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
import { Calendar } from "../../components/ui/calendar";
import { FolderType, TagType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { FolderComponent } from "../../components/Folder";
import {
  getOrgFolderList,
  getUserFolderList,
} from "../../utility/endpoints/FolderEndpoints";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";
import { UserStarred } from "../../utility/types/UserTypes";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export enum OwnerTypeOptions {
  Any = "Any",
  "Me" = "Me",
  "Organization" = "Organization",
}

export enum StarredOptions {
  All = "All",
  Starred = "Starred",
  "Not Starred" = "Not Starred",
}

interface ListFoldersProps {
  noShowMenu?: boolean;
  onClick?: (folderId: string, isOrgFolder: boolean) => void;
  disableFolderId?: string;
}

export default function ListFolders(props: ListFoldersProps): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orgFolderList, setOrgFolderList] = useState<Array<FolderType>>([]);
  const [userFolderList, setUserFolderList] = useState<Array<FolderType>>([]);
  const [orgFilteredFolderList, setOrgFilteredFolderList] = useState<
    Array<FolderType>
  >([]);
  const [userFilteredFolderList, setUserFilteredFolderList] = useState<
    Array<FolderType>
  >([]);
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const [starred, setStarred] = useState<UserStarred | undefined>();
  const [filters, setFilters] = useState<{
    sort: SortOptions;
    starred: StarredOptions;
    owner: OwnerTypeOptions;
    startDate: Date | undefined;
    endDate: Date | undefined;
    tags: string;
  }>({
    sort: SortOptions.Newest, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
    starred: StarredOptions.All,
    owner: OwnerTypeOptions.Any,
    startDate: undefined,
    endDate: undefined,
    tags: "none",
  });
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    if (orgFolderList.length === 0) {
      getOrgFolders("", controller.signal);
    }
    if (userFolderList.length === 0) {
      getUserFolders("", controller.signal);
    }
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
    if (starred && starred.folders) {
      //Default Sort by newest and starred
      setOrgFolderList((prev) => {
        return orderFolderNewestCreatedAndStarred(
          prev,
          starred && starred.folders ? starred.folders : []
        );
      });
      setOrgFilteredFolderList((prev) => {
        return orderFolderNewestCreatedAndStarred(
          prev,
          starred && starred.folders ? starred.folders : []
        );
      });
      setUserFolderList((prev) => {
        return orderFolderNewestCreatedAndStarred(
          prev,
          starred && starred.folders ? starred.folders : []
        );
      });
      setUserFilteredFolderList((prev) => {
        return orderFolderNewestCreatedAndStarred(
          prev,
          starred && starred.folders ? starred.folders : []
        );
      });
    }
    //Note: only these ones cause they don't change that often
    // eslint-disable-next-line
  }, [starred, orgFolderList, userFolderList]);

  // Handle search filtering
  useEffect(() => {
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleFilter(syntheticEvent);
    // eslint-disable-next-line
  }, [searchTerm]);

  function getOrgFolders(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getOrgFolderList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (
          res.data &&
          res.data.folders &&
          res.data.ScannedCount !== undefined
        ) {
          //Get the list of all folders
          setOrgFolderList((prev) => [...prev, ...res.data.folders]);
          setOrgFilteredFolderList((prev) => [...prev, ...res.data.folders]);
          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getOrgFolders(res.data.LastEvaluatedKey.id, signal);
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

  function getUserFolders(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getUserFolderList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (
          res.data &&
          res.data.folders &&
          res.data.ScannedCount !== undefined
        ) {
          //Get the list of all folders
          setUserFolderList((prev) => [...prev, ...res.data.folders]);
          setUserFilteredFolderList((prev) => [...prev, ...res.data.folders]);
          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getUserFolders(res.data.LastEvaluatedKey.id, signal);
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

  function refreshList() {
    setIsLoading(true);
    setOrgFolderList([]);
    setUserFolderList([]);
    setUserFilteredFolderList([]);
    setOrgFilteredFolderList([]);
    const controller = new AbortController();
    getOrgFolders("", controller.signal);
    getUserFolders("", controller.signal);
    getStarred(controller.signal);
  }

  function loading() {
    setIsLoading(true);
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    //create deep copies
    var orgFilteredFolderList = JSON.parse(JSON.stringify(orgFolderList));
    var userFilteredFolderList = JSON.parse(JSON.stringify(userFolderList));

    //handle owner
    if (filters.owner === OwnerTypeOptions.Me) {
      //then remove org folders
      orgFilteredFolderList = [];
    } else if (filters.owner === OwnerTypeOptions.Organization) {
      //then remove user folders
      userFilteredFolderList = [];
    }

    //handle starred filter
    if ((filters.starred as string) === StarredOptions.All) {
      //Do nothing
    } else if (
      (filters.starred as string) === StarredOptions.Starred &&
      starred &&
      starred.folders
    ) {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (x: FolderType) =>
          starred.folders && starred.folders.some((y) => y.folderId === x.id)
      );
      userFilteredFolderList = userFilteredFolderList.filter(
        (x: FolderType) =>
          starred.folders && starred.folders.some((y) => y.folderId === x.id)
      );
    } else if (
      (filters.starred as string) === StarredOptions["Not Starred"] &&
      starred &&
      starred.folders
    ) {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (x: FolderType) =>
          starred.folders && !starred.folders.some((y) => y.folderId === x.id)
      );
      userFilteredFolderList = userFilteredFolderList.filter(
        (x: FolderType) =>
          starred.folders && !starred.folders.some((y) => y.folderId === x.id)
      );
    }

    //handle searching
    if (searchTerm !== "") {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (folder: FolderType) =>
          folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          folder.prompts.some((prompt) =>
            prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      userFilteredFolderList = userFilteredFolderList.filter(
        (folder: FolderType) =>
          folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          folder.prompts.some((prompt) =>
            prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    //handle tag
    if (filters.tags && filters.tags !== "none") {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (folder: FolderType) =>
          folder.prompts.some((p) => p.tags.includes(filters.tags))
      );
      userFilteredFolderList = userFilteredFolderList.filter(
        (folder: FolderType) =>
          folder.prompts.some((p) => p.tags.includes(filters.tags))
      );
    }

    // handle date filtering
    if (filters.startDate) {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (folder: FolderType) => {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          return filters.startDate ? date > filters.startDate : true;
        }
      );
      userFilteredFolderList = userFilteredFolderList.filter(
        (folder: FolderType) => {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          return filters.startDate ? date > filters.startDate : true;
        }
      );
    }
    if (filters.endDate) {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (folder: FolderType) => {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          return filters.endDate ? date < filters.endDate : true;
        }
      );
      userFilteredFolderList = userFilteredFolderList.filter(
        (folder: FolderType) => {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          return filters.endDate ? date < filters.endDate : true;
        }
      );
    }

    // handle sorting
    if ((filters.sort as string) === SortOptions.Ascending) {
      orgFilteredFolderList = orderFolderAscendingNameAndStarred(
        orgFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
      userFilteredFolderList = orderFolderAscendingNameAndStarred(
        userFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
    } else if ((filters.sort as string) === SortOptions.Descending) {
      orgFilteredFolderList = orderFolderDescendingNameAndStarred(
        orgFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
      userFilteredFolderList = orderFolderDescendingNameAndStarred(
        userFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
    } else if ((filters.sort as string) === SortOptions.Oldest) {
      orgFilteredFolderList = orderFolderOldestCreatedAndStarred(
        orgFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
      userFilteredFolderList = orderFolderOldestCreatedAndStarred(
        userFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
    } else if ((filters.sort as string) === SortOptions.Newest) {
      orgFilteredFolderList = orderFolderNewestCreatedAndStarred(
        orgFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
      userFilteredFolderList = orderFolderNewestCreatedAndStarred(
        userFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
    } else {
      //newest
      orgFilteredFolderList = orderFolderNewestCreatedAndStarred(
        orgFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
      userFilteredFolderList = orderFolderNewestCreatedAndStarred(
        userFilteredFolderList,
        starred && starred.folders ? starred.folders : []
      );
    }

    //Finally set the filtered lists
    setOrgFilteredFolderList(orgFilteredFolderList);
    setUserFilteredFolderList(userFilteredFolderList);
  }

  function handleResetFilters() {
    setSearchTerm("");
    setFilters({
      sort: SortOptions.Newest, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
      starred: StarredOptions.All,
      owner: OwnerTypeOptions.Any,
      startDate: undefined,
      endDate: undefined,
      tags: "none",
    });
    setOrgFilteredFolderList(orgFolderList);
    setUserFilteredFolderList(userFolderList);
  }

  return !isLoading ? (
    <div className="space-y-6">
      {props.noShowMenu && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          To add an asset (including prompts and documents) to your module,
          navigate to the folder in which the asset is hosted.
          <span className="italic">
            {" "}
            Note: Assets must be created or uploaded in the Library before they
            can be added to a module.
          </span>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search library..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover
            open={isFilterPopoverOpen}
            onOpenChange={setIsFilterPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-2 font-medium">
                  <SlidersHorizontal className="h-5 w-5" />
                  Filters
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Filter folders by date, tags, owner, and more.
                </p>
              </div>
              <div className="space-y-6 p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="sort-select">Sort</Label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => {
                      setFilters((prev) => ({
                        ...prev,
                        sort: SortOptions[value as keyof typeof SortOptions],
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(SortOptions).map((key) => (
                        <SelectItem value={key} key={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="starred-select">Starred</Label>
                  <Select
                    value={filters.starred}
                    onValueChange={(value) => {
                      setFilters((prev) => ({
                        ...prev,
                        starred:
                          StarredOptions[value as keyof typeof StarredOptions],
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by starred status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(StarredOptions).map((key) => (
                        <SelectItem value={key} key={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-select">Owner</Label>
                  <Select
                    value={filters.owner}
                    onValueChange={(value) => {
                      setFilters((prev) => ({
                        ...prev,
                        owner:
                          OwnerTypeOptions[
                            value as keyof typeof OwnerTypeOptions
                          ],
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(OwnerTypeOptions).map((key) => (
                        <SelectItem value={key} key={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tag-select">Tag</Label>
                  <Select
                    value={filters.tags}
                    onValueChange={(value) => {
                      setFilters((prev) => ({
                        ...prev,
                        tags: value,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" key="none">
                        No filter
                      </SelectItem>
                      {tagList.map((tag, i) => (
                        <SelectItem value={tag.id} key={i}>
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
                    <Popover
                      open={startDateOpen}
                      onOpenChange={setStartDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.startDate && "text-muted-foreground"
                          )}
                          disabled={isLoading}
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
                          disabled={isLoading}
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

              <div className="border-t p-4 flex gap-2">
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
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Folder Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgFilteredFolderList.map((folder: FolderType, i) => {
          if (props.disableFolderId && props.disableFolderId === folder.id) {
            return null;
          }
          return (
            <FolderComponent
              key={`${i}org`}
              isOrganizationFolder
              displayName={folder.name}
              onClick={() =>
                props.onClick
                  ? props.onClick(folder.id, true)
                  : navigator(`/library/org/${folder.id}`)
              }
              folder={folder}
              keyy={`${i}org`}
              refreshList={refreshList}
              loading={loading}
              isStarred={
                starred &&
                starred.folders &&
                starred.folders.some((c) => c.folderId === folder.id)
              }
              noShowMenu={props.noShowMenu}
            />
          );
        })}
        {userFilteredFolderList.map((folder: FolderType, i) => {
          if (props.disableFolderId && props.disableFolderId === folder.id) {
            return null;
          }
          return (
            <FolderComponent
              key={`${i}user`}
              displayName={folder.name}
              onClick={() =>
                props.onClick
                  ? props.onClick(folder.id, false)
                  : navigator(`/library/${folder.id}`)
              }
              folder={folder}
              keyy={`${i}`}
              refreshList={refreshList}
              loading={loading}
              isStarred={
                starred &&
                starred.folders &&
                starred.folders.some((c) => c.folderId === folder.id)
              }
              noShowMenu={props.noShowMenu}
            />
          );
        })}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading Folders</p>
    </div>
  );
}

export function orderFolderAscendingNameAndStarred(
  list: Array<FolderType>,
  starred: Array<{ folderId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.folderId === a.id);
    const bIsFavorite = starred.some((m) => m.folderId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by name
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

export function orderFolderDescendingNameAndStarred(
  list: Array<FolderType>,
  starred: Array<{ folderId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.folderId === a.id);
    const bIsFavorite = starred.some((m) => m.folderId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by name
    return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
  });
}

export function orderFolderOldestCreatedAndStarred(
  list: Array<FolderType>,
  starred: Array<{ folderId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.folderId === a.id);
    const bIsFavorite = starred.some((m) => m.folderId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by oldest
    return a.id > b.id ? 1 : -1;
  });
}

export function orderFolderNewestCreatedAndStarred(
  list: Array<FolderType>,
  starred: Array<{ folderId: string }>
) {
  return list.sort((a, b) => {
    const aIsFavorite = starred.some((m) => m.folderId === a.id);
    const bIsFavorite = starred.some((m) => m.folderId === b.id);

    // Step 1: Put favorites first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Step 2: Sort by most recent (assuming ISO date string or timestamp)
    return a.id < b.id ? 1 : -1;
  });
}
