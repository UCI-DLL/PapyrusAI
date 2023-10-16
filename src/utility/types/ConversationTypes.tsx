

export type ConversationListType = {
  conversations: Array<ConversationType>,
  id: string,
  moduleId: string,
}

export type ConversationType = {
  id: string,
  isDeleted: boolean,
  messages: Array<string>
}

export type MessageType = {
  id: string,
  content: string,
  messageType: string,
  role: string,
  sender: string,
  timestamp: string
}