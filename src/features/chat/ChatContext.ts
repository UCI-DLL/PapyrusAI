import { Dispatch, SetStateAction } from "react";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import { ConversationListType } from "../../utility/types/ConversationTypes";
import { UserType } from "../../utility/types/UserTypes";

export interface ChatContextType {
  courseInfo: CourseType | undefined;
  moduleInfo: ModuleType | undefined;
  conversationList: ConversationListType | undefined;
  setConversationList: Dispatch<
    SetStateAction<ConversationListType | undefined>
  >;
  viewUser: UserType | undefined;
  user: UserType | null; 
  instructor: string;
  admin: string;
}
