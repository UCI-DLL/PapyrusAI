import React, { useEffect, useState } from "react";
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
import { FolderType, TagType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { Folder } from "../../components/Folder";
import {
  getOrgFolderList,
  getUserFolderList
} from "../../utility/endpoints/FolderEndpoints";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";


export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export enum OwnerTypeOptions {
  Any = "Any",
  "Me" = "Me",
  "Organization" = "Organization"
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
  const [orgFilteredFolderList, setOrgFilteredFolderList] = useState<Array<FolderType>>([]);
  const [userFilteredFolderList, setUserFilteredFolderList] = useState<Array<FolderType>>([]);
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const [filters, setFilters] = useState<{
    search: string,
    sort: SortOptions,
    owner: OwnerTypeOptions,
    startDate: Dayjs | null,
    endDate: Dayjs | null,
    tags: string
  }>({
    search: "", //title of folder or title or contents of prompts
    sort: SortOptions.Ascending, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
    owner: OwnerTypeOptions.Any,
    startDate: null,
    endDate: null,
    tags: ""
  });
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
    setIsLoading(true);
    if (orgFolderList.length === 0) {
      getOrgFolders("", controller.signal)
    }
    if (userFolderList.length === 0) {
      getUserFolders("", controller.signal)
    }
    if (tagList.length === 0) {
      getTags("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function getOrgFolders(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getOrgFolderList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.folders && res.data.ScannedCount !== undefined) {
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
    Get(getUserFolderList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.folders && res.data.ScannedCount !== undefined) {
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

  function refreshList() {
    setIsLoading(true);
    setOrgFolderList([]);
    setUserFolderList([]);
    setUserFilteredFolderList([]);
    setOrgFilteredFolderList([]);
    const controller = new AbortController();
    getOrgFolders("", controller.signal);
    getUserFolders("", controller.signal);
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

    //handle searching
    if (filters.search !== "") {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (folder: FolderType) => folder.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          folder.prompts.some((prompt) => prompt.prompt.toLowerCase().includes(filters.search.toLowerCase()))
      );
      userFilteredFolderList = userFilteredFolderList.filter(
        (folder: FolderType) => folder.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          folder.prompts.some((prompt) => prompt.prompt.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    //handle tag 
    if (filters.tags) {
      orgFilteredFolderList = orgFilteredFolderList.filter(
        (folder: FolderType) => folder.prompts.some(p => p.tags.includes(filters.tags))
      )
      userFilteredFolderList = userFilteredFolderList.filter(
        (folder: FolderType) => folder.prompts.some(p => p.tags.includes(filters.tags))
      )
    }

    // handle date filtering
    //Note: have to do a lot of date converting
    if (filters.startDate !== null) {
      orgFilteredFolderList = orgFilteredFolderList.filter((folder: FolderType) => {
        if (filters.startDate !== null) {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) > filters.startDate) {
            return folder
          } else {
            return false
          }
        } else {
          return folder
        }
      });
      userFilteredFolderList = userFilteredFolderList.filter((folder: FolderType) => {
        if (filters.startDate !== null) {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) > filters.startDate) {
            return folder
          } else {
            return false
          }
        } else {
          return folder
        }
      });
    }
    if (filters.endDate !== null) {
      orgFilteredFolderList = orgFilteredFolderList.filter((folder: FolderType) => {
        if (filters.endDate !== null) {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) < filters.endDate) {
            return folder
          } else {
            return false
          }
        } else {
          return folder
        }
      });
      userFilteredFolderList = userFilteredFolderList.filter((folder: FolderType) => {
        if (filters.endDate !== null) {
          var date = new Date(parseInt(folder.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) < filters.endDate) {
            return folder
          } else {
            return false
          }
        } else {
          return folder
        }
      });
    }

    // handle sorting
    if (filters.sort as string === SortOptions.Ascending) {
      orgFilteredFolderList.sort((a: FolderType, b: FolderType) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
      userFilteredFolderList.sort((a: FolderType, b: FolderType) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
    } else if (filters.sort as string === SortOptions.Descending) {
      orgFilteredFolderList.sort((a: FolderType, b: FolderType) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0));
      userFilteredFolderList.sort((a: FolderType, b: FolderType) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0));
    } else if (filters.sort as string === SortOptions.Oldest) {
      orgFilteredFolderList.sort((a: FolderType, b: FolderType) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6)));
      userFilteredFolderList.sort((a: FolderType, b: FolderType) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6)));
    } else if (filters.sort as string === SortOptions.Newest) {
      orgFilteredFolderList.sort((a: FolderType, b: FolderType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
      userFilteredFolderList.sort((a: FolderType, b: FolderType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
    } else { //newest
      orgFilteredFolderList.sort((a: FolderType, b: FolderType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
      userFilteredFolderList.sort((a: FolderType, b: FolderType) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)));
    }

    //Finally set the filtered lists
    setOrgFilteredFolderList(orgFilteredFolderList);
    setUserFilteredFolderList(userFilteredFolderList);
  }

  function handleResetFilters() {
    setFilters({
      search: "", //title of folder or title or contents of prompts
      sort: SortOptions.Ascending, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
      owner: OwnerTypeOptions.Any,
      startDate: null,
      endDate: null,
      tags: ""
    });
    setOrgFilteredFolderList(orgFolderList);
    setUserFilteredFolderList(userFolderList);
  }


  return !isLoading ? (
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
            <InputLabel shrink={true} id="creator-select-label">Owner</InputLabel>
            <Select
              value={filters.owner}
              onChange={(e: SelectChangeEvent) => {
                setFilters((prev) => ({ ...prev, owner: OwnerTypeOptions[e.target.value as keyof typeof OwnerTypeOptions] }));
              }}
              label="Owner"
              labelId="creator-select-label"
              id="creator-select"
              sx={{ width: 320, maxWidth: '100%' }}
            >
              {Object.keys(OwnerTypeOptions).map((key) => {
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
      <div className="library__folder-list">
        {orgFilteredFolderList.map((folder: FolderType, i) => {
          if (props.disableFolderId && props.disableFolderId === folder.id) {
            return <></>
          }
          return (
            <div key={i}>
              <Folder
                isOrganizationFolder
                displayName={folder.name}
                onClick={() => props.onClick ? props.onClick(folder.id, true) : navigator(`/library/org/${folder.id}`)}
                folder={folder}
                keyy={`${i}org`}
                refreshList={refreshList}
                loading={loading}
                noShowMenu={props.noShowMenu}
              />
            </div>
          )
        })}
        {userFilteredFolderList.map((folder: FolderType, i) => {
          if (props.disableFolderId && props.disableFolderId === folder.id) {
            return <></>
          }
          return (
            <div key={i}>
              <Folder
                displayName={folder.name}
                onClick={() => props.onClick ? props.onClick(folder.id, false) : navigator(`/library/${folder.id}`)}
                folder={folder}
                keyy={`${i}`}
                refreshList={refreshList}
                loading={loading}
                noShowMenu={props.noShowMenu}
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