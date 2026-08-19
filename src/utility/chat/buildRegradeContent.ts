import { ModuleType } from "../types/CourseTypes";
import { MessageType } from "../types/ConversationTypes";

export function buildRegradeContent(
  messages: MessageType[],
  viewUser: { name: string; family_name: string },
  moduleInfo: ModuleType
): string {
  const sortedMessages = [...messages].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)).reverse();

  if (moduleInfo.essaySubmission) {
    const essayMessage = sortedMessages.find(
      (m) => m.role === "user" && (m.messageType === "essayDraft" || m.messageType === "file")
    );
    return essayMessage?.content ?? "";
  }

  // Build chat transcript
  let transcript = "";
  sortedMessages.forEach((m) => {
    if (m.userVisible === false) return;
    const sender = m.sender === "ChatGPT" ? "Papyrus" : `${viewUser.name} ${viewUser.family_name}`;
    const content = m.content.replace(/LLM sources:\n?/g, "").trim();
    transcript += `${sender}: ${content}\n\n`;
  });
  return transcript.trim();
}
