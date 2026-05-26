import React, { useContext } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { RubricType, FolderType } from "../utility/types/CourseTypes";
import { LayoutGrid, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router";
import { AlertContext } from "../utility/context/AlertContext";
import { useState } from "react";

interface RubricProps {
  rubric: RubricType;
  folder: FolderType;
  keyy: string;
  refreshList: () => void;
  loading: () => void;
  noShowMenu?: boolean;
  onClick?: (folderId: string, id: string, isOrgFolder: boolean, type: string) => void;
  isSelected?: boolean;
}

export const Rubric = (props: RubricProps) => {
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const isOrgFolder = props.rubric.isOrganizationRubric;

  function edit() {
    props.loading();
    const path = isOrgFolder
      ? `/library/org/${props.folder.id}/rubrics/${props.rubric.id}`
      : `/library/${props.folder.id}/rubrics/${props.rubric.id}`;
    navigator(path);
  }

  function handleCardClick() {
    if (props.onClick) {
      props.onClick(props.folder.id, props.rubric.id, isOrgFolder, "rubric");
    } else {
      edit();
    }
  }

  function deleteRubric() {
    const key = `rubrics_${props.folder.id}`;
    const existing: RubricType[] = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify(existing.filter((r) => r.id !== props.rubric.id)));
    setAlert({ message: "Rubric deleted.", type: "success" });
    setOpenDeleteDialog(false);
    props.refreshList();
  }

  return (
    <div key={props.keyy}>
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Delete Rubric"
        description={`"${props.rubric.name}" will be permanently deleted.`}
        actions={[
          { label: "Cancel", onClick: () => setOpenDeleteDialog(false), variant: "outline" },
          { label: "Delete", onClick: deleteRubric, variant: "destructive" },
        ]}
      />

      <Card
        className="h-full hover:shadow-md transition-shadow duration-200 group cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Rubric
              </span>
            </div>
            {!props.noShowMenu && (
              <DropdownWrapper
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center p-1"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
                actions={[
                  { label: "Edit", onClick: edit },
                  { label: "Delete", onClick: () => setOpenDeleteDialog(true) },
                ]}
                align="end"
              />
            )}
          </div>

          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
            {props.rubric.name || "Untitled Rubric"}
          </h3>

          <p className="text-xs text-muted-foreground mb-3">
            {props.rubric.criteria.length} criterion
            {props.rubric.criteria.length !== 1 ? "a" : ""} ·{" "}
            {props.rubric.columns.length} score level
            {props.rubric.columns.length !== 1 ? "s" : ""}
          </p>

          {props.rubric.tags && props.rubric.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto">
              {props.rubric.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {props.rubric.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{props.rubric.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
