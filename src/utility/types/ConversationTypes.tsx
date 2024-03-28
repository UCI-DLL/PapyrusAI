

export type ConversationListType = {
  conversations: Array<ConversationType>,
  id: string,
  moduleId: string,
}

export type ConversationType = {
  id: string,
  isDeleted: boolean,
  messages: Array<string>,
  name: string
}

export type MessageType = {
  id: string,
  content: string,
  messageType: MessageTypeType, 
  role: string,
  sender: string,
  timestamp: string,
  inContext?: boolean,
  promptId?: null | string,
}

export type MessageTypeType = "text" | "file"