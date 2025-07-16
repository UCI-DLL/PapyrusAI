

export type ConversationListType = {
  conversations: Array<ConversationType>,
  id: string,
  moduleId: string,
}

export type ConversationType = {
  id: string,
  isDeleted: boolean,
  messages: Array<string>,
  name: string,
  completed?: boolean,
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
  userVisible?: boolean,
  raterReference?: string | Array<Array<string>>,
  expandableMessage?: string,
  stream?: Array<StreamMessageType>,
}

export type MessageTypeType = "text" | "file"

export type StreamMessageType = {
  message: string,
  id: string,
  timestamp: number,
  finished: boolean,
  messageType: string
}