import React from "react";
import { useNavigate } from "react-router";
import { Divider, List, ListItem, ListItemText } from "@mui/material";
import { ModuleType } from "../../utility/types/CourseTypes";

interface ModuleListProps {
  list: Array<ModuleType>
}

export default function ModuleList({ list }: ModuleListProps): JSX.Element {
  let navigator = useNavigate();
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };

  return (
    <div className="modules__list">
      <List sx={style} aria-label="modules list">
        {list.map((module, index) => {
          return (
            <>
            {/* TODO update this button redirect  */}
              <button onClick={() => navigator("/module")}> 
                <ListItem>
                  <ListItemText primary={module.name} secondary={module.moduleDescription} />
                </ListItem>
              </button>
              {index !== list.length -1 ? ( //only have dividers between modules
                <Divider />
              ) : <></>}
            </>
          )
        })}
      </List>

    </div>
  )
}