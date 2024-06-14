
import React from "react";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import PushPinIcon from '@mui/icons-material/PushPin';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface FolderProps {
  displayName: string;
  isOrganizationFolder?: boolean;
  onClick: any;
  menuList: Array<string>;
  menuFunctions: Array<(e: any) => void>;
  key: number;
  truncateNumber?: number;
}

export const Folder = (props: FolderProps) => {
  const displayName = props.displayName ? props.displayName : "Displayname";
  const [addAnchorEl, setAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const addOpen = Boolean(addAnchorEl);
  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddAnchorEl(event.currentTarget);
  };
  const handleAddClose = () => {
    setAddAnchorEl(null);
  };
  function truncateString(str: string, maxLength: number) {
    if (str.length > maxLength) {
      return str.substring(0, maxLength - 3) + '...';
    }
    return str;
  }

  return (
    <div key={props.key}>
      <Button
        variant="contained"
        color='white'
        className="folder"
        size='large'
        sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}
        onClick={props.onClick}
      >
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          {props.isOrganizationFolder ? (
            <PushPinIcon />
          ) : <></>}
          <FolderIcon />
          {truncateString(displayName, props.truncateNumber ? props.truncateNumber : 25)}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton
            aria-label="folder menu"
            edge="start"
            type="button"
            id={`${props.key}-button`}
            aria-controls={addOpen ? `${props.key}-menu` : undefined}
            aria-haspopup="true"
            aria-expanded={addOpen ? 'true' : undefined}
            onClick={(e: any) => {
              e.stopPropagation()
              handleAddClick(e)
            }}
          >
            {<MoreVertIcon />}
          </IconButton>
        </div>
      </Button>
      <Menu
        id={`${props.key}-menu`}
        anchorEl={addAnchorEl}
        open={addOpen}
        onClose={handleAddClose}
        MenuListProps={{
          'aria-labelledby': 'folder-menu-button',
        }}
      >
        {props.menuList.map((item, index) => {
          return (
            <MenuItem key={index} onClick={(e: any) => {
              props.menuFunctions[index](e)
            }}>
              {item}
            </MenuItem>
          )
        })}
      </Menu>
    </div>

  );
};


