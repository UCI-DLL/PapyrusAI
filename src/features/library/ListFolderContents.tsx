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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetTrigger,
} from "../../components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../components/ui/tooltip";
import {
    FileType,
    FolderType,
    PromptType,
    TagType,
} from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
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
import { Search, Filter, Calendar, FileText } from "lucide-react";

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
        startDate: Dayjs | null;
        endDate: Dayjs | null;
        tags: string;
        type: TypeOptions;
    }>({
        search: "", //title of folder or title or contents of prompts
        sort: SortOptions.Newest, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
        starred: StarredOptions.All,
        startDate: null,
        endDate: null,
        tags: "",
        type: TypeOptions.All,
    });
    const [tagList, setTagList] = useState<Array<TagType>>([]);
    const [openFilters, setOpenFilters] = useState<boolean>(false);

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
                if (
                    res.data &&
                    res.data.tags &&
                    res.data.ScannedCount !== undefined
                ) {
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
                    starred.files &&
                    !starred.files.some((y) => y.fileId === x.id)
            );
            filteredPrompts = filteredPrompts.filter(
                (x: PromptType) =>
                    starred.prompts &&
                    !starred.prompts.some((y) => y.promptId === x.id)
            );
        }

        //handle searching
        if (filters.search !== "") {
            filteredPrompts = filteredPrompts.filter(
                (prompt: PromptType) =>
                    prompt.name
                        .toLowerCase()
                        .includes(filters.search.toLowerCase()) ||
                    prompt.prompt
                        .toLowerCase()
                        .includes(filters.search.toLowerCase())
            );
            filteredFiles = filteredFiles.filter(
                (file: FileType) =>
                    file.name
                        .toLowerCase()
                        .includes(filters.search.toLowerCase()) ||
                    file.name
                        .toLowerCase()
                        .includes(filters.search.toLowerCase())
            );
        }
        //handle tag
        if (filters.tags) {
            filteredPrompts = filteredPrompts.filter((prompt: PromptType) =>
                prompt.tags ? prompt.tags.includes(filters.tags) : prompt
            );
            filteredFiles = filteredFiles.filter((file: FileType) =>
                file.tags ? file.tags.includes(filters.tags) : file
            );
        }

        //handle date
        //Note: have to do a lot of date converting
        if (filters.startDate !== null) {
            filteredPrompts = filteredPrompts.filter((prompt: PromptType) => {
                if (filters.startDate !== null) {
                    var date = new Date(
                        parseInt(prompt.id.substring(0, 13), 10)
                    );
                    if (dayjs(date.toISOString()) > filters.startDate) {
                        return prompt;
                    } else {
                        return false;
                    }
                } else {
                    return prompt;
                }
            });
            filteredFiles = filteredFiles.filter((file: FileType) => {
                if (filters.startDate !== null) {
                    var date = new Date(parseInt(file.id.substring(0, 13), 10));
                    if (dayjs(date.toISOString()) > filters.startDate) {
                        return file;
                    } else {
                        return false;
                    }
                } else {
                    return file;
                }
            });
        }
        if (filters.endDate !== null) {
            filteredPrompts = filteredPrompts.filter((prompt: PromptType) => {
                if (filters.endDate !== null) {
                    var date = new Date(
                        parseInt(prompt.id.substring(0, 13), 10)
                    );
                    if (dayjs(date.toISOString()) < filters.endDate) {
                        return prompt;
                    } else {
                        return false;
                    }
                } else {
                    return prompt;
                }
            });
            filteredFiles = filteredFiles.filter((file: FileType) => {
                if (filters.endDate !== null) {
                    var date = new Date(parseInt(file.id.substring(0, 13), 10));
                    if (dayjs(date.toISOString()) < filters.endDate) {
                        return file;
                    } else {
                        return false;
                    }
                } else {
                    return file;
                }
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
            prev
                ? { ...prev, prompts: filteredPrompts, files: filteredFiles }
                : prev
        );
    }

    function handleResetFilters() {
        setFilters({
            search: "", //title of folder or title or contents of prompts
            sort: SortOptions.Newest, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
            starred: StarredOptions.All,
            startDate: null,
            endDate: null,
            tags: "",
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

    return !isLoading && filteredFolder ? (
        <div className="space-y-6">
            {/* Advanced Filters Sheet */}
            <Sheet open={openFilters} onOpenChange={setOpenFilters}>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Advanced Filters</SheetTitle>
                        <SheetDescription>
                            Filter content by various criteria
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>
                            <Input
                                id="search"
                                placeholder="Search content..."
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                    }))
                                }
                            />
                        </div>

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
                                    {Object.values(StarredOptions).map(
                                        (starred) => (
                                            <SelectItem
                                                key={starred}
                                                value={starred}
                                            >
                                                {starred}
                                            </SelectItem>
                                        )
                                    )}
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
                                    {tagList.map((tag) => (
                                        <SelectItem key={tag.id} value={tag.id}>
                                            {tag.id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePicker
                                        label="Start Date"
                                        value={filters.startDate}
                                        onChange={(value) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                startDate: value,
                                            }))
                                        }
                                    />
                                    <DatePicker
                                        label="End Date"
                                        value={filters.endDate}
                                        onChange={(value) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                endDate: value,
                                            }))
                                        }
                                    />
                                </div>
                            </LocalizationProvider>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={handleResetFilters}>
                            Clear All
                        </Button>
                        <Button
                            onClick={(e) => {
                                handleFilter(e);
                                setOpenFilters(false);
                            }}
                        >
                            Apply Filters
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                starred.prompts.some(
                                    (p) => p.promptId === prompt.id
                                ) &&
                                starred.prompts.some(
                                    (c) => c.folderId === props.folderId
                                )
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
                                starred.files.some(
                                    (p) => p.fileId === file.id
                                ) &&
                                starred.files.some(
                                    (c) => c.folderId === props.folderId
                                )
                            }
                        />
                    ))}
            </div>

            {/* Empty State */}
            {filteredFolder &&
                (!filteredFolder.prompts ||
                    filteredFolder.prompts.length === 0) &&
                (!filteredFolder.files ||
                    filteredFolder.files.length === 0) && (
                    <div className="text-center py-12">
                        <div className="mx-auto h-12 w-12 text-gray-400">
                            <FileText className="h-12 w-12" />
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                            No content found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating your first prompt or
                            uploading a file.
                        </p>
                    </div>
                )}
        </div>
    ) : (
        <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-gray-600">Loading content...</p>
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
