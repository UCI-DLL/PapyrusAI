// TypeScript interfaces for data structures
export interface User {
  sub: string;
  name?: string;
  family_name?: string;
  email?: string;
}

export interface Message {
  timestamp: number | string;
}

export interface Conversation {
  user?: User;
  messages?: Message[];
  classification?: string; // Added for classification support
}

export interface Module {
  name?: string;
  conversations?: Conversation[];
}

export interface Course {
  name?: string;
  id?: string;
  modules?: Module[];
}

// Helper to get week range string (Sunday to Saturday) for a given timestamp
export function getWeekRangeString(timestamp: number | string): string {
  const date = new Date(Number(timestamp));
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return `${sunday.getMonth() + 1}/${sunday.getDate()} - ${
    saturday.getMonth() + 1
  }/${saturday.getDate()}`;
}

export function getWeeklyConvoLengths(
  data: Course[]
): { week: string; avg_convo_length: number }[] {
  const weekMap: Record<string, { total: number; count: number }> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const week = getWeekRangeString(Number(firstMsg.timestamp));
        if (!weekMap[week]) weekMap[week] = { total: 0, count: 0 };
        weekMap[week].total += convo.messages.length;
        weekMap[week].count += 1;
      }
    }
  }
  return Object.entries(weekMap)
    .map(([week, { total, count }]) => ({
      week,
      avg_convo_length: count ? total / count : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function getWeeklyConvoCounts(
  data: Course[]
): { week: string; num_convos: number }[] {
  const weekMap: Record<string, number> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const week = getWeekRangeString(Number(firstMsg.timestamp));
        weekMap[week] = (weekMap[week] || 0) + 1;
      }
    }
  }
  return Object.entries(weekMap)
    .map(([week, num_convos]) => ({ week, num_convos }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function getStudentList(data: Course[]): User[] {
  const students: Record<string, User> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.user) continue;
        const { sub, name, family_name, email } = convo.user;
        if (sub && !students[sub]) {
          students[sub] = { sub, name, family_name, email };
        }
      }
    }
  }
  return Object.values(students);
}

export function getStudentConversations(
  data: Course[],
  studentSub: string
): Conversation[] {
  const conversations: Conversation[] = [];
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (convo.user && convo.user.sub === studentSub) {
          conversations.push(convo);
        }
      }
    }
  }
  return conversations;
}

export function getStudentWeeklyConvoLengths(
  data: Course[],
  studentSub: string
): { week: string; avg_convo_length: number }[] {
  const convos = getStudentConversations(data, studentSub);
  const weekMap: Record<string, { total: number; count: number }> = {};
  for (const convo of convos) {
    if (!convo.messages || convo.messages.length === 0) continue;
    const firstMsg = convo.messages[0];
    if (!firstMsg.timestamp) continue;
    const week = getWeekRangeString(Number(firstMsg.timestamp));
    if (!weekMap[week]) weekMap[week] = { total: 0, count: 0 };
    weekMap[week].total += convo.messages.length;
    weekMap[week].count += 1;
  }
  return Object.entries(weekMap)
    .map(([week, { total, count }]) => ({
      week,
      avg_convo_length: count ? total / count : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function getStudentWeeklyConvoCounts(
  data: Course[],
  studentSub: string
): { week: string; num_convos: number }[] {
  const convos = getStudentConversations(data, studentSub);
  const weekMap: Record<string, number> = {};
  for (const convo of convos) {
    if (!convo.messages || convo.messages.length === 0) continue;
    const firstMsg = convo.messages[0];
    if (!firstMsg.timestamp) continue;
    const week = getWeekRangeString(Number(firstMsg.timestamp));
    weekMap[week] = (weekMap[week] || 0) + 1;
  }
  return Object.entries(weekMap)
    .map(([week, num_convos]) => ({ week, num_convos }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function getModuleUsageFrequency(
  data: Course[]
): { moduleName: string; count: number }[] {
  const freqMap: Record<string, number> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      const moduleName = module.name || "(No Name)";
      const count = module.conversations ? module.conversations.length : 0;
      freqMap[moduleName] = (freqMap[moduleName] || 0) + count;
    }
  }
  return Object.entries(freqMap)
    .map(([moduleName, count]) => ({ moduleName, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Returns the count of each conversation classification per week.
 * Output: Array of { week: string, classification: string, count: number }
 */
export function getWeeklyClassificationCounts(
  data: Course[]
): { week: string; classification: string; count: number }[] {
  const weekClassMap: Record<string, Record<string, number>> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const week = getWeekRangeString(Number(firstMsg.timestamp));
        const classification = convo.classification || "(Unclassified)";
        if (!weekClassMap[week]) weekClassMap[week] = {};
        weekClassMap[week][classification] =
          (weekClassMap[week][classification] || 0) + 1;
      }
    }
  }
  // Flatten to array
  const result: { week: string; classification: string; count: number }[] = [];
  for (const week in weekClassMap) {
    for (const classification in weekClassMap[week]) {
      result.push({
        week,
        classification,
        count: weekClassMap[week][classification],
      });
    }
  }
  // Sort by week then classification
  return result.sort((a, b) => {
    const weekCmp = a.week.localeCompare(b.week);
    if (weekCmp !== 0) return weekCmp;
    return a.classification.localeCompare(b.classification);
  });
}

/**
 * Returns the count of conversations per module per week.
 * Output: Array of { week: string, moduleName: string, count: number }
 */
export function getWeeklyModuleUsage(
  data: Course[]
): { week: string; moduleName: string; count: number }[] {
  const weekModuleMap: Record<string, Record<string, number>> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      const moduleName = module.name || "(No Name)";
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const week = getWeekRangeString(Number(firstMsg.timestamp));
        if (!weekModuleMap[week]) weekModuleMap[week] = {};
        weekModuleMap[week][moduleName] =
          (weekModuleMap[week][moduleName] || 0) + 1;
      }
    }
  }
  // Flatten to array
  const result: { week: string; moduleName: string; count: number }[] = [];
  for (const week in weekModuleMap) {
    for (const moduleName in weekModuleMap[week]) {
      result.push({
        week,
        moduleName,
        count: weekModuleMap[week][moduleName],
      });
    }
  }
  // Sort by week then moduleName
  return result.sort((a, b) => {
    const weekCmp = a.week.localeCompare(b.week);
    if (weekCmp !== 0) return weekCmp;
    return a.moduleName.localeCompare(b.moduleName);
  });
}

export function getStudentModuleUsage(
  data: Course[],
  studentSub: string
): { moduleName: string; count: number }[] {
  const moduleMap: Record<string, number> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      const moduleName = module.name || "(No Name)";
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (convo.user && convo.user.sub === studentSub) {
          moduleMap[moduleName] = (moduleMap[moduleName] || 0) + 1;
        }
      }
    }
  }
  return Object.entries(moduleMap)
    .map(([moduleName, count]) => ({ moduleName, count }))
    .sort((a, b) => b.count - a.count);
}

export function getStudentClassificationCounts(
  data: Course[],
  studentSub: string
): { classification: string; count: number }[] {
  const classificationMap: Record<string, number> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (convo.user && convo.user.sub === studentSub) {
          const classification = convo.classification || "(Unclassified)";
          classificationMap[classification] =
            (classificationMap[classification] || 0) + 1;
        }
      }
    }
  }
  return Object.entries(classificationMap)
    .map(([classification, count]) => ({ classification, count }))
    .sort((a, b) => b.count - a.count);
}

// Analyze a single course for all metrics, including per-student analysis
export function analyzeCourse(course: Course): {
  moduleUsageFrequency: { moduleName: string; count: number }[];
  weeklyConvoLengths: { week: string; avg_convo_length: number }[];
  weeklyConvoCounts: { week: string; num_convos: number }[];
  weeklyClassificationCounts: {
    week: string;
    classification: string;
    count: number;
  }[];
  weeklyModuleUsage: { week: string; moduleName: string; count: number }[];
  students: Record<
    string,
    {
      info: User;
      weeklyConvoLengths: { week: string; avg_convo_length: number }[];
      weeklyConvoCounts: { week: string; num_convos: number }[];
      totalMessages: number;
      moduleUsage: { moduleName: string; count: number }[];
      classificationCounts: { classification: string; count: number }[];
    }
  >;
} {
  // Wrap course in array to reuse existing functions
  const moduleUsageFrequency = getModuleUsageFrequency([course]);
  const weeklyConvoLengths = getWeeklyConvoLengths([course]);
  const weeklyConvoCounts = getWeeklyConvoCounts([course]);
  const weeklyClassificationCounts = getWeeklyClassificationCounts([course]);
  const weeklyModuleUsage = getWeeklyModuleUsage([course]);
  // Student-level analysis
  const students: Record<
    string,
    {
      info: User;
      weeklyConvoLengths: { week: string; avg_convo_length: number }[];
      weeklyConvoCounts: { week: string; num_convos: number }[];
      totalMessages: number;
      moduleUsage: { moduleName: string; count: number }[];
      classificationCounts: { classification: string; count: number }[];
    }
  > = {};
  const studentList = getStudentList([course]);
  for (const student of studentList) {
    const convos = getStudentConversations([course], student.sub);
    const totalMessages = convos.reduce(
      (sum, c) => sum + (c.messages?.length || 0),
      0
    );
    students[student.sub] = {
      info: student,
      weeklyConvoLengths: getStudentWeeklyConvoLengths([course], student.sub),
      weeklyConvoCounts: getStudentWeeklyConvoCounts([course], student.sub),
      totalMessages,
      moduleUsage: getStudentModuleUsage([course], student.sub),
      classificationCounts: getStudentClassificationCounts(
        [course],
        student.sub
      ),
    };
  }
  return {
    moduleUsageFrequency,
    weeklyConvoLengths,
    weeklyConvoCounts,
    weeklyClassificationCounts,
    weeklyModuleUsage,
    students,
  };
}

// Main function for analyzing all courses from json
// TODO: Adapt to lambda function
export default function analyzeAllCourses(
  data: Course[]
): Record<string, ReturnType<typeof analyzeCourse>> {
  const result: Record<string, ReturnType<typeof analyzeCourse>> = {};
  for (const course of data) {
    const key = course.name || course.id || "Unknown Course";
    result[key] = analyzeCourse(course);
  }
  return result;
}
