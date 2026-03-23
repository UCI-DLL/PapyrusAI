// TypeScript interfaces for data structures
export interface StudentConversationData {
  username: string;
  name: string;
  family_name: string;
  email: string;
  numConversations: number;
  totalMessages: number;
  hasConversations: boolean; // true if at least one conversation with at least one message
}

export interface ModuleStatistics {
  totalConversations: number;
  averageMessagesPerConversation: number;
  studentsWithConversations: number;
}

// Calculate module statistics
export function calculateModuleStatistics(students: StudentConversationData[]): ModuleStatistics {
  const studentsWithConvos = students.filter((s) => s.hasConversations);
  const totalConvos = students.reduce((sum, s) => sum + s.numConversations, 0);
  const totalMessages = students.reduce((sum, s) => sum + s.totalMessages, 0);

  return {
    totalConversations: totalConvos,
    averageMessagesPerConversation: totalConvos > 0 ? Math.round((totalMessages / totalConvos) * 10) / 10 : 0,
    studentsWithConversations: studentsWithConvos.length,
  };
}

// Process user list and conversation data to create student conversation numbers
export function processStudentConversationData(
  userList: Array<{
    username: string;
    name: string;
    family_name: string;
    email?: string;
    numConvos: number;
  }>,
  conversationData: Record<
    string,
    Array<{
      conversations: Array<{
        messages?: Array<{ timestamp?: number | string }>;
      }>;
    }>
  >,
): StudentConversationData[] {
  return userList.map((user) => {
    const userConvos = conversationData[user.username];
    let totalMessages = 0;
    let hasConversations = false;

    if (userConvos && userConvos.length > 0) {
      userConvos.forEach((convoGroup) => {
        if (convoGroup.conversations) {
          convoGroup.conversations.forEach((convo) => {
            if (convo.messages && convo.messages.length > 0) {
              totalMessages += convo.messages.length;
              hasConversations = true;
            }
          });
        }
      });
    }

    return {
      username: user.username,
      name: user.name,
      family_name: user.family_name,
      email: user.email ?? "",
      numConversations: user.numConvos,
      totalMessages,
      hasConversations: hasConversations || user.numConvos > 0,
    };
  });
}
