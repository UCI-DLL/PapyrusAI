import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
} from "@mui/material";
import { FileType, FolderType, PromptType, TagType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { getOrgFolder, getUserFolder } from "../../utility/endpoints/FolderEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import { Prompt } from "../../components/Prompt";
import { File } from "../../components/File";
import { UserStarred } from "../../utility/types/UserTypes";
import { getUserFavoritingData } from "../../utility/endpoints/UserEndpoints";


export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export enum TypeOptions {
  All = "All",
  Prompt = "Prompt",
  File = "File"
}

export enum StarredOptions {
  All = "All",
  Starred = "Starred",
  "Not Starred" = "Not Starred"
}

interface ListPromptsProps {
  folderId: string;
  isOrgFolder: boolean;
  noShowMenu?: boolean;
  onClick?: (folderId: string, id: string, isOrgFolder: boolean, type: string) => void; //type is "prompt" or "file"
}

export default function ListFolderContents(props: ListPromptsProps): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folder, setFolder] = useState<FolderType>();
  const [filteredFolder, setFilteredFolder] = useState<FolderType>();
  const { setAlert } = useContext(AlertContext);
  const [starred, setStarred] = useState<UserStarred | undefined>();
  const [filters, setFilters] = useState<{
    search: string,
    sort: SortOptions,
    starred: StarredOptions,
    startDate: Dayjs | null,
    endDate: Dayjs | null,
    tags: string,
    type: TypeOptions,
  }>({
    search: "", //title of folder or title or contents of prompts
    sort: SortOptions.Ascending, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
    starred: StarredOptions.All,
    startDate: null,
    endDate: null,
    tags: "",
    type: TypeOptions.All,
  });
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const controller = new AbortController();
    //get user folder data
    getFolder(props.isOrgFolder, props.folderId, controller.signal)

    if (tagList.length === 0) {
      getTags("", controller.signal)
    }

    getStarred(controller.signal)

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function getFolder(isOrg: boolean, folderId: string, signal: AbortSignal) {
    if (!isOrg) {
      Get(getUserFolder(folderId), signal).then(res => {
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
            setAlert({ message: "Folder Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    } else {
      Get(getOrgFolder(folderId), signal).then(res => {
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
            setAlert({ message: "Folder Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    }
  }

  function getTags(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getTagList(limit, startKey), signal).then(res => {
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
    Get(getUserFavoritingData(), signal).then(res => {
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
    e.preventDefault()
    if (!folder) return //return if no folder
    if (!filteredFolder) return

    var filteredPrompts = folder.prompts
    var filteredFiles = folder.files

    //handle asset type
    if (filters.type === TypeOptions.Prompt) {
      filteredFiles = []
    }
    if (filters.type === TypeOptions.File) {
      filteredPrompts = []
    }

    //handle starred filter
    if (filters.starred as string === StarredOptions.All) {
      //Do nothing
    } else if (filters.starred as string === StarredOptions.Starred && starred && (starred.files || starred.prompts)) {
      filteredFiles = filteredFiles.filter((x: FileType) => starred.files && starred.files.some(y => y.fileId === x.id && y.folderId === folder.id))
      filteredPrompts = filteredPrompts.filter((x: PromptType) => starred.prompts && starred.prompts.some(y => y.promptId === x.id && y.folderId === folder.id))
    } else if (filters.starred as string === StarredOptions["Not Starred"] && starred && (starred.files || starred.prompts)) {
      filteredFiles = filteredFiles.filter((x: FileType) => starred.files && !starred.files.some(y => y.fileId === x.id))
      filteredPrompts = filteredPrompts.filter((x: PromptType) => starred.prompts && !starred.prompts.some(y => y.promptId === x.id))
    }

    //handle searching
    if (filters.search !== "") {
      filteredPrompts = filteredPrompts.filter(
        (prompt: PromptType) => prompt.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          prompt.prompt.toLowerCase().includes(filters.search.toLowerCase())
      );
      filteredFiles = filteredFiles.filter(
        (file: FileType) => file.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          file.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    //handle tag
    if (filters.tags) {
      filteredPrompts = filteredPrompts.filter(
        (prompt: PromptType) => prompt.tags ? prompt.tags.includes(filters.tags) : prompt
      )
      filteredFiles = filteredFiles.filter(
        (file: FileType) => file.tags ? file.tags.includes(filters.tags) : file
      )
    }

    //handle date
    //Note: have to do a lot of date converting
    if (filters.startDate !== null) {
      filteredPrompts = filteredPrompts.filter((prompt: PromptType) => {
        if (filters.startDate !== null) {
          var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) > filters.startDate) {
            return prompt
          } else {
            return false
          }
        } else {
          return prompt
        }
      });
      filteredFiles = filteredFiles.filter((file: FileType) => {
        if (filters.startDate !== null) {
          var date = new Date(parseInt(file.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) > filters.startDate) {
            return file
          } else {
            return false
          }
        } else {
          return file
        }
      });
    }
    if (filters.endDate !== null) {
      filteredPrompts = filteredPrompts.filter((prompt: PromptType) => {
        if (filters.endDate !== null) {
          var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) < filters.endDate) {
            return prompt
          } else {
            return false
          }
        } else {
          return prompt
        }
      });
      filteredFiles = filteredFiles.filter((file: FileType) => {
        if (filters.endDate !== null) {
          var date = new Date(parseInt(file.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) < filters.endDate) {
            return file
          } else {
            return false
          }
        } else {
          return file
        }
      });
    }

    // handle sorting
    if (filters.sort as string === SortOptions.Ascending) {
      filteredPrompts.sort((a: PromptType, b: PromptType) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
      filteredFiles.sort((a: FileType, b: FileType) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
    } else if (filters.sort as string === SortOptions.Descending) {
      filteredPrompts.sort((a: PromptType, b: PromptType) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0));
      filteredFiles.sort((a: FileType, b: FileType) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0));
    } else if (filters.sort as string === SortOptions.Oldest) {
      filteredPrompts.sort((a: PromptType, b: PromptType) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6)));
      filteredFiles.sort((a: FileType, b: FileType) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6)));
    } else if (filters.sort as string === SortOptions.Newest) {
      filteredPrompts.sort((a: PromptType, b: PromptType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
      filteredFiles.sort((a: FileType, b: FileType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
    } else { //newest
      filteredPrompts.sort((a: PromptType, b: PromptType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
      filteredFiles.sort((a: FileType, b: FileType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
    }

    //finally set the filtered lists
    setFilteredFolder(prev => prev ? ({ ...prev, prompts: filteredPrompts, files: filteredFiles }) : prev)
  }

  function handleResetFilters() {
    setFilters({
      search: "", //title of folder or title or contents of prompts
      sort: SortOptions.Ascending, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
      starred: StarredOptions.All,
      startDate: null,
      endDate: null,
      tags: "",
      type: TypeOptions.All
    });
    setFilteredFolder(folder);
  }

  function refreshList() {
    setIsLoading(true);
    setTagList([]);
    const controller = new AbortController();
    //get user folder data
    getFolder(props.isOrgFolder, props.folderId, controller.signal)
    getTags("", controller.signal);
    getStarred(controller.signal);
  }

  return !isLoading && filteredFolder ? (
    <div className="library">
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <div className="library__filter" key={"menu"}>
          <div className="library__filter__title">
            <div>
              Filters
            </div>
            <IconButton
              aria-label="close filter options"
              sx={{ padding: "0" }}
              id="close-filter-button"
              onClick={handleClose}
            >
              <CloseIcon />
            </IconButton>
          </div>
          <hr />
          <TextField
            name="search"
            label="Has the words"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={filters.search}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }}
          />
          <FormControl sx={{ width: "100%", marginBottom: "1rem" }}>
            <InputLabel shrink={true} id="type-select-label">Type</InputLabel>
            <Select
              value={filters.type}
              onChange={(e: SelectChangeEvent) => {
                setFilters((prev) => ({ ...prev, type: TypeOptions[e.target.value as keyof typeof TypeOptions] }));
              }}
              label="Type"
              labelId="type-select-label"
              id="type-select"
              sx={{ width: 320, maxWidth: '100%' }}
              notched={true}
            >
              {Object.keys(TypeOptions).map(key => {
                return (
                  <MenuItem value={key} key={key}>{key}</MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <FormControl sx={{ width: "100%", marginBottom: "1rem" }}>
            <InputLabel shrink={true} id="sort-select-label">Sort</InputLabel>
            <Select
              value={filters.sort}
              onChange={(e: SelectChangeEvent) => {
                setFilters((prev) => ({ ...prev, sort: SortOptions[e.target.value as keyof typeof SortOptions] }));
              }}
              label="Sort"
              labelId="sort-select-label"
              id="sort-select"
              sx={{ width: 320, maxWidth: '100%' }}
              notched={true}
            >
              {Object.keys(SortOptions).map(key => {
                return (
                  <MenuItem value={key} key={key}>{key}</MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <FormControl sx={{ width: "100%", marginBottom: "1rem" }}>
            <InputLabel shrink={true} id="sort-select-label">Starred</InputLabel>
            <Select
              value={filters.starred}
              onChange={(e: SelectChangeEvent) => {
                setFilters((prev) => ({ ...prev, starred: StarredOptions[e.target.value as keyof typeof StarredOptions] }));
              }}
              label="Starred"
              labelId="starred-select-label"
              id="starred-select"
              sx={{ width: 320, maxWidth: '100%' }}
              notched={true}
            >
              {Object.keys(StarredOptions).map(key => {
                return (
                  <MenuItem value={key} key={key}>{key}</MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <FormControl sx={{ width: "100%", marginBottom: "1rem" }}>
            <InputLabel shrink={true} id="tag-select-label">Tag</InputLabel>
            <Select
              value={filters.tags}
              onChange={(e: SelectChangeEvent) => {
                setFilters((prev) => ({ ...prev, tags: e.target.value }));
              }}
              label="Tags"
              labelId="tag-select-label"
              id="tag-select"
              sx={{ width: 320, maxWidth: '100%' }}
              notched={true}
            >
              {Object.values(tagList).map((tag, i) => {
                return (
                  <MenuItem value={tag.id} key={i}>{tag.id}</MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <span style={{ marginTop: "1rem" }}>Date Created</span>
          <LocalizationProvider dateAdapter={AdapterDayjs} >
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(value) => {
                setFilters(prev => ({ ...prev, startDate: value }))
              }}
              disabled={isLoading}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs} >
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(value) => {
                setFilters(prev => ({ ...prev, endDate: value }))
              }}
              disabled={isLoading}
              sx={{ marginTop: "1rem" }}
            />
          </LocalizationProvider>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={(e) => {
              handleClose()
              handleFilter(e)
            }}
          >
            Search
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleResetFilters}>
            Clear
          </Button>
        </div>
      </Menu>
      {/* search bar */}
      <form className="library__searchbar" onSubmit={handleFilter}>
        <FormControl fullWidth>
          <OutlinedInput
            id="outlined-adornment-message"
            placeholder="Search"
            size="small"
            value={filters.search}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="more filter options"
                  edge="end"
                  id="basic-button"
                  aria-controls={open ? 'basic-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  onClick={handleClick}
                >
                  {
                    <Tooltip
                      title={"Advanced Search"}
                    >
                      <TuneIcon />
                    </Tooltip>
                  }
                </IconButton>
              </InputAdornment>
            }
            startAdornment={
              <InputAdornment position="start">
                <IconButton
                  aria-label="search"
                  edge="start"
                  type="submit"
                >
                  {<SearchIcon />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
      </form>
      <hr />
      <div className="library__prompt-list">
        {filteredFolder && filteredFolder.prompts && filteredFolder.prompts.map((prompt: PromptType, i) => {
          return (
            <div key={i}>
              <Prompt
                prompt={prompt}
                folder={filteredFolder}
                keyy={`${i}`}
                refreshList={() => refreshList()}
                loading={() => setIsLoading(true)}
                noShowMenu={props.noShowMenu}
                onClick={props.onClick}
                isStarred={starred && starred.prompts && starred.prompts.some(p => p.promptId === prompt.id) && starred.prompts.some(c => c.folderId === props.folderId)}
              />
            </div>
          )
        })}
      </div>
      <div className="library__file-list">
        {filteredFolder && filteredFolder.files && filteredFolder.files.map((file: FileType, i) => {
          return (
            <div key={i}>
              <File
                file={file}
                folder={filteredFolder}
                keyy={`${i}`}
                refreshList={() => refreshList()}
                loading={() => setIsLoading(true)}
                noShowMenu={props.noShowMenu}
                onClick={props.onClick}
                isStarred={starred && starred.files && starred.files.some(p => p.fileId === file.id) && starred.files.some(c => c.folderId === props.folderId)}
              />
            </div>
          )
        })}
      </div>
    </div>
  ) : (
    <LinearProgress />
  )
}