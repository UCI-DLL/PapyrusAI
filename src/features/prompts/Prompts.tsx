import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { PromptType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getPromptList } from "../../utility/endpoints/PromptEndpoints";
import CreatePromptForm from "./CreatePromptForm";
import { CustomUserType } from "../../utility/types/UserTypes";
import { Search, Filter, Plus, Loader2, User, Calendar } from "lucide-react";
import { cn } from "../../lib/utils";

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
  const [filter, setFilter] = useState<{
    search: string,
    sort: SortOptions,
    creator: string
  }>({
    search: "", //title or prompt
    sort: SortOptions.Ascending, //ascending alphabetical, descending alphabetical, date created (newest, oldest)
    creator: ""//by creator filter
  });
  const [filteredPromptList, setFilteredPromptList] = useState<Array<PromptType>>([]);
  const [creatorList, setCreatorList] = useState<Array<CustomUserType>>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

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
            if (currentCreators.some(p => p.username === prompt.creator.username)) {
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

    //handle creator filter
    if (filter.creator !== "") {
      filteredList = filteredList.filter(prompt => prompt.creator.username === filter.creator);
    }

    //then set filtered list
    setFilteredPromptList(filteredList);

  }, [filter, promptList])

  function handleSortPromptList(value: string) {
    const sortOption = value as SortOptions;
    setFilter((prev) => ({ ...prev, sort: sortOption }));
  }

  function handleSearchPromptList(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  }

  function clearFilters() {
    setFilter({
      search: "",
      sort: SortOptions.Ascending,
      creator: ""
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading prompts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={showAddPromptModal} onOpenChange={setShowAddPromptModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <CreatePromptForm
              closeForm={() => {
                //then close modal
                setShowAddPromptModal(false);
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPromptModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">All Prompts</h1>
        <Button onClick={() => setShowAddPromptModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Prompt
        </Button>
      </div>

      <Separator />

      {/* Filter, sort, search  */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={filter.search}
            onChange={handleSearchPromptList}
            className="pl-9"
          />
        </div>

        <Select value={filter.sort} onValueChange={handleSortPromptList}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(SortOptions).map(key => (
              <SelectItem value={key} key={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Creator</Label>
                <Select value={filter.creator} onValueChange={(value) => setFilter(prev => ({ ...prev, creator: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All creators</SelectItem>
                    {creatorList.map((creator, index) => (
                      <SelectItem value={creator.username} key={index}>
                        {creator.name} {creator.family_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                Clear filters
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredPromptList.length > 0 ? (
        <div className="grid gap-4">
          {filteredPromptList.map((prompt, index) => {
            var date = new Date(parseInt(prompt.id.substring(0, 13), 10)).toLocaleString();
            return (
              <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigator(`/prompts/${prompt.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-medium">{prompt.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{prompt.creator.name} {prompt.creator.family_name}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {prompt.prompt.substring(0, 120) + (prompt.prompt.length > 120 ? '...' : "")}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{date}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No prompts found</p>
        </div>
      )}
    </div>
  );
}