import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Divider, List, ListItem, ListItemText } from "@mui/material";
import { PromptType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { Modal } from "../../components/Modal";
import { getPromptList } from "../../utility/endpoints/PromptEndpoints";
import CreatePromptForm from "./CreatePromptForm";


export default function Prompts(): JSX.Element {
  let navigator = useNavigate();
  const [promptList, setPromptList] = useState<Array<PromptType>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [showAddPromptModal, setShowAddPromptModal] = useState<boolean>(false);
  const style = {
    width: '100%',
    bgcolor: 'background.paper',
  };

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddPromptModal) {
      setIsLoading(true);
      Get(getPromptList(), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            //Get the list of all prompts
            setPromptList(res.data);
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setError("No Prompts Found");
        }
        setIsLoading(false);
      });
    }
    // eslint-disable-next-line
  }, [showAddPromptModal]);


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
          {promptList.length > 0 ? (
            <div className="modules__list">
              <List sx={style} aria-label="modules list">
                {promptList.map((prompt, index) => {
                  return (
                    <div key={index}>
                      {/* button redirect to the conversation */}
                      <ListItem sx={{ justifyContent: "space-between", width: "100%" }}>
                        <button onClick={() => navigator(`/prompts/${prompt.id}`)} style={{ textAlign: "left" }}>
                          <ListItemText 
                          primary={`${prompt.name} - Created by: ${prompt.creator.name} ${prompt.creator.familyName}`} 
                          secondary={prompt.prompt.substring(0, 120) + (prompt.prompt.length > 120 ? '...' : "")} 
                          />
                        </button>
                      </ListItem>
                      {index !== promptList.length - 1 ? ( //only have dividers between prompts
                        <Divider />
                      ) : <></>}
                    </div>
                  )
                })}
              </List>
            </div>
          ) : (
            <div>No available modules</div>
          )}
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}