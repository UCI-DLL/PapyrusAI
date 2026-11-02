import { CourseType, ModuleType, RubricCriterion } from "../types/CourseTypes";
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

function formatRubric(moduleInfo: ModuleType): string {
  const rubric = moduleInfo.rubrics?.[0];
  if (!rubric) return "";

  const divider = "─".repeat(60);
  const totalPoints = rubric.criteria.reduce((sum, c) => sum + c.maxPoints, 0);

  let out = "\n" + "━".repeat(60) + "\n";
  out += `RUBRIC: ${rubric.name}\n`;
  if (rubric.description) out += `${rubric.description}\n`;
  out += "\n";

  rubric.criteria.forEach((criterion: RubricCriterion) => {
    out += `${criterion.name}  (${criterion.maxPoints} pts)\n`;
    if (criterion.description) out += `  ${criterion.description}\n`;
    if (criterion.ratings?.length > 0) {
      out += "\n";
      criterion.ratings
        .slice()
        .sort((a, b) => b.maxPoints - a.maxPoints)
        .forEach((rating) => {
          const pts = `${rating.maxPoints} pts`.padStart(7);
          out += `  • ${rating.name} (${pts})`;
          if (rating.description) out += `: ${rating.description}`;
          out += "\n";
        });
    }
    out += divider + "\n";
  });

  out += `Total: ${totalPoints} pts\n`;
  out += "━".repeat(60) + "\n";
  return out;
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
    "\n" +
    formatRubric(moduleInfo) +
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
  const safeUserName = `${viewUser.name}_${viewUser.family_name}`.replace(/\s+/g, "_");
  link.download = `${courseInfo.name}_${moduleInfo.name}_${safeUserName}_conversation${conversationIndex}.txt`;
  link.href = url;
  link.click();
}
