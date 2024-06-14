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
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { CustomUserType } from "../../utility/types/UserTypes";
import { Folder } from "../../components/Folder";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export default function Library(): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const menuList = ["hello", "world"]
  function something() {
    console.log(1)
  }

  return !isLoading ? (
    <div className="library">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <div>Library</div>
          <Folder
            isOrganizationFolder
            displayName="Folder"
            onClick={() => console.log("here")}
            menuList={menuList}
            menuFunctions={[something, something]}
            key={0}
          />
          <Folder
            displayName="Folder2skdjfn skdjnf ksjdnfksjdncviu nsodn osdnf osd"
            onClick={() => console.log("here2")}
            menuList={menuList}
            menuFunctions={[something, something]}
            key={1}
          />
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}