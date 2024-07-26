import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { PromptType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { Modal } from "../../components/Modal";
import { getPromptList } from "../../utility/endpoints/PromptEndpoints";
import CreatePromptForm from "./CreatePromptForm";
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { CustomUserType } from "../../utility/types/UserTypes";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export default function OldPrompts(): JSX.Element {
  let navigator = useNavigate();
  const [promptList, setPromptList] = useState<Array<PromptType>>([]); //og prompt list
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [showAddPromptModal, setShowAddPromptModal] = useState<boolean>(false);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };
  const [filter, setFilter] = useState<{
    search: string,
    sort: SortOptions,
    creator: string,
    startDate: Dayjs | null,
    endDate: Dayjs | null
  }>({
    search: "", //title or prompt
    sort: SortOptions.Ascending, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
    creator: "",//by creator or date range are filters
    startDate: null,
    endDate: null
  });
  const [filteredPromptList, setFilteredPromptList] = useState<Array<PromptType>>([]);
  const [creatorList, setCreatorList] = useState<Array<CustomUserType>>([])
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
    if (!showAddPromptModal && promptList.length === 0) {
      setIsLoading(true);
      getPrompts("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [showAddPromptModal]);

  function getPrompts(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getPromptList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.prompts && res.data.ScannedCount !== undefined) {
          //Get the list of all prompts
          setPromptList((prev) => [...prev, ...res.data.prompts]);
          setFilteredPromptList((prev) => [...prev, ...res.data.prompts]);

          //Add creators to list
          var currentCreators = creatorList;
          res.data.prompts.forEach((prompt: PromptType) => {
            if (currentCreators.some(p => p.sub === prompt.creator.sub)) {
              //creator is already in the list so move on
            } else {
              currentCreators.push(prompt.creator);
            }
          });
          setCreatorList(currentCreators); //update creator list

          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getPrompts(res.data.LastEvaluatedKey.id, signal);
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
          setError("No Prompts Found");
          setIsLoading(false);
        }
      }
    });
  }

  useEffect(() => {
    var filteredList = promptList;

    //handle search
    if (filter.search !== "") {
      filteredList = filteredList.filter(
        prompt => prompt.name.toLowerCase().includes(filter.search.toLowerCase()) ||
          prompt.prompt.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    //handle sort
    if (filter.sort as string === SortOptions.Descending) {
      filteredList = filteredList.sort((a, b) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0))
    } else if (filter.sort as string === SortOptions.Ascending) {
      filteredList = filteredList.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0))
    } else if (filter.sort as string === SortOptions.Oldest) {
      filteredList = filteredList.sort((a, b) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6)))
    } else if (filter.sort as string === SortOptions.Newest) {
      filteredList = filteredList.sort((a, b) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6)))
    } else { //default to ascending order
      filteredList = filteredList.sort((a, b) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0))
    }

    //handle filters
    //Note: have to do a lot of date converting
    if (filter.startDate !== null) {
      filteredList = filteredList.filter(prompt => {
        if (filter.startDate !== null) {
          var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) > filter.startDate) {
            return prompt
          } else {
            return false
          }
        } else {
          return prompt
        }
      });
    }
    if (filter.endDate !== null) {
      filteredList = filteredList.filter(prompt => {
        if (filter.endDate !== null) {
          var date = new Date(parseInt(prompt.id.substring(0, 13), 10));
          if (dayjs(date.toISOString()) < filter.endDate) {
            return prompt
          } else {
            return false
          }
        } else {
          return prompt
        }
      });
    }
    //handle creator filter
    if (filter.creator !== "") {
      filteredList = filteredList.filter(prompt => prompt.creator.sub === filter.creator);
    }

    //then set filtered list
    setFilteredPromptList(filteredList);

  }, [filter, promptList])

  function handleSortPromptList(e: SelectChangeEvent) {
    if (e.target.value as string === SortOptions.Ascending) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Ascending }));
      setFilteredPromptList(prev => prev.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0)));
    } else if (e.target.value as string === SortOptions.Descending) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Descending }));
      setFilteredPromptList(prev => prev.sort((a, b) => (b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : ((a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : 0)));
    } else if (e.target.value as string === SortOptions.Oldest) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Oldest }));
      setFilteredPromptList(prev => prev.sort((a, b) => parseInt(a.id.substring(0, a.id.length - 6)) - parseInt(b.id.substring(0, b.id.length - 6))));
    } else if (e.target.value as string === SortOptions.Newest) {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Newest }));
      setFilteredPromptList(prev => prev.sort((a, b) => parseInt(b.id.substring(0, b.id.length - 6)) - parseInt(a.id.substring(0, a.id.length - 6))));
    } else {
      setFilter((prev) => ({ ...prev, sort: SortOptions.Ascending }));
    }
  }

  function handleSearchPromptList(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  }

  function clearFilters() {
    setFilter({
      search: "",
      sort: SortOptions.Ascending,
      creator: "",
      startDate: null,
      endDate: null
    });
    setFilteredPromptList(promptList);
  }

  return !isLoading ? (
    <div className="prompts">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="prompts__section-header">
            <Modal
              isOpen={showAddPromptModal}
              title={"Create Prompt"}
              onRequestClose={() => setShowAddPromptModal(false)}
              actions={
                <Button sx={{ width: "100%" }} variant="contained" color="secondary" onClick={() => setShowAddPromptModal(false)}>
                  Cancel
                </Button>
              }
            >
              <CreatePromptForm
                closeForm={() => {
                  //then close modal
                  setShowAddPromptModal(false);
                }}
              />
            </Modal>
            <h3>All Prompts</h3>
            <div>
              &nbsp;&nbsp;&nbsp;
              <Button variant="contained" onClick={() => setShowAddPromptModal(true)}>Create Prompt</Button>
            </div>

          </div>
          <hr />

          {/* Filter, sort, search  */}
          <div className="prompts__filter">
            <FormControl sx={{ minWidth: "200px" }}>
              <InputLabel shrink={true} id="sort-select-label">Sort</InputLabel>
              <Select
                value={filter.sort}
                onChange={handleSortPromptList}
                label="Sort"
                labelId="sort-select-label"
                id="sort-select"
                notched={true}
              >
                {Object.keys(SortOptions).map(key => {
                  return (
                    <MenuItem value={key} key={key}>{key}</MenuItem>
                  )
                })}
              </Select>
            </FormControl>
            &nbsp;&nbsp;&nbsp;
            <FormControl fullWidth>
              <OutlinedInput
                id="outlined-adornment-message"
                placeholder="Search"
                sx={{ width: "100%" }}
                value={filter.search}
                onChange={handleSearchPromptList}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="sumbit new message"
                      edge="end"
                      type="submit"
                    >
                      {<SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
            &nbsp;&nbsp;&nbsp;

            <Button
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
              variant="outlined"
            >
              Filter
            </Button>
            <FormControl>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }} key={"menu"}>
                  <InputLabel shrink={true} sx={{ marginTop: "1rem" }}>Creator</InputLabel>
                  <Select
                    value={filter.creator}
                    onChange={(e: SelectChangeEvent) => {
                      setFilter((prev) => ({ ...prev, creator: e.target.value }))
                    }}
                    labelId="creator-select-label"
                    id="creator-select"
                    sx={{ width: 320, maxWidth: '100%', margin: "1rem" }}
                    renderValue={(selected) => {//find the creator name for the user id
                      return creatorList.find(p => p.sub === selected)?.name + " " + creatorList.find(p => p.sub === selected)?.family_name
                    }}
                  >
                    <MenuItem value={""} key={"NoCreator"}></MenuItem>
                    {creatorList.map((creator, index) => {
                      return (
                        <MenuItem value={creator.sub} key={index}>{creator.name} {creator.family_name}</MenuItem>
                      )
                    })}
                  </Select>
                  <LocalizationProvider dateAdapter={AdapterDayjs} >
                    <DatePicker
                      label="Start Date"
                      value={filter.startDate}
                      onChange={(value) => {
                        setFilter(prev => ({ ...prev, startDate: value }))
                      }}
                      disabled={isLoading}
                      sx={{ margin: "1rem" }}
                    />
                  </LocalizationProvider>
                  <LocalizationProvider dateAdapter={AdapterDayjs} >
                    <DatePicker
                      label="End Date"
                      value={filter.endDate}
                      onChange={(value) => {
                        setFilter(prev => ({ ...prev, endDate: value }))
                      }}
                      disabled={isLoading}
                      sx={{ margin: "1rem" }}
                    />
                  </LocalizationProvider>
                </div>
              </Menu>
            </FormControl>
            &nbsp;&nbsp;&nbsp;
            <Button onClick={clearFilters}>Clear</Button>
          </div>

          <hr />


          {filteredPromptList.length > 0 ? (
            <div className="modules__list">
              <List sx={style} aria-label="modules list">
                {filteredPromptList.map((prompt, index) => {
                  var date = new Date(parseInt(prompt.id.substring(0, 13), 10)).toLocaleString();
                  return (
                    <div key={index}>
                      {/* button redirect to the conversation */}
                      <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                        <button onClick={() => navigator(`/prompts/${prompt.id}`)} style={{ textAlign: "left" }}>
                          <ListItemText
                            primary={`${prompt.name} - Created by: ${prompt.creator.name} ${prompt.creator.family_name}`}
                            secondary={prompt.prompt.substring(0, 120) + (prompt.prompt.length > 120 ? '...' : "")}
                          />
                          <p>{date}</p>
                        </button>
                      </ListItem>
                      {index !== filteredPromptList.length - 1 ? ( //only have dividers between prompts
                        <Divider />
                      ) : <></>}
                    </div>
                  )
                })}
              </List>
            </div>
          ) : (
            <div>No available prompts</div>
          )}
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}