import { CourseType, ModuleType } from "../types/CourseTypes";
import { MessageType } from "../types/ConversationTypes";
import { CustomUserType, UserType } from "../types/UserTypes";

interface DownloadConversationParams {
  courseInfo: CourseType;
  moduleInfo: ModuleType;
  user: UserType;
  viewUser: CustomUserType;
  messages: MessageType[];
  conversationIndex: string;
  isInstructor: boolean;
}

export function downloadConversation({
  courseInfo,
  moduleInfo,
  user,
  viewUser,
  messages,
  conversationIndex,
  isInstructor,
}: DownloadConversationParams): void {
  const sortedMessages = [...messages]
    .sort(
      (a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)
    )
    .reverse();

  let fileData =
    courseInfo.name +
    "\n" +
    moduleInfo.name +
    "\n" +
    courseInfo.instructor.name +
    " " +
    courseInfo.instructor.family_name +
    "\n" +
    "User: " +
    user.email +
    "\n";

  sortedMessages.forEach((message, idx) => {
    if (!moduleInfo.showInitialPrompt && idx === 0 && !isInstructor) {
      return;
    }
    if (message.userVisible !== undefined && !message.userVisible && !isInstructor) {
      return;
    }

    const dateTime = new Date(
      parseInt(message.id.substring(0, 13), 10)
    ).toLocaleString();
    const sender =
      message.sender === "ChatGPT"
        ? "Papyrus"
        : viewUser.name + " " + viewUser.family_name;

    const content = message.content.replace(/ChatGPT sources:\n?/g, "").trim();

    fileData += sender + " - " + dateTime + "\n" + content + "\n";

    if (message.sources) {
      const parsedSources =
        typeof message.sources === "string"
          ? JSON.parse(message.sources)
          : message.sources;
      if (Array.isArray(parsedSources) && parsedSources.length > 0) {
        fileData += "Sources:\n";
        parsedSources.forEach((source: { url: string; title: string }) => {
          fileData += `  - ${source.title}: ${source.url}\n`;
        });
      }
    }

    fileData += "\n";
  });

  const blob = new Blob([fileData], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${courseInfo.name}_${moduleInfo.name}_${user.email}_conversation${conversationIndex}.txt`;
  link.href = url;
  link.click();
}
