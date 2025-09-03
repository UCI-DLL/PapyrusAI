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

// Helper to get daily date string (MM/DD/YYYY) for a given timestamp
export function getDailyDateString(timestamp: number | string): string {
  const date = new Date(Number(timestamp));
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
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

export function getDailyConvoLengths(
  data: Course[]
): { date: string; avg_convo_length: number }[] {
  const dateMap: Record<string, { total: number; count: number }> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const date = getDailyDateString(Number(firstMsg.timestamp));
        if (!dateMap[date]) dateMap[date] = { total: 0, count: 0 };
        dateMap[date].total += convo.messages.length;
        dateMap[date].count += 1;
      }
    }
  }
  return Object.entries(dateMap)
    .map(([date, { total, count }]) => ({
      date,
      avg_convo_length: count ? total / count : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getDailyConvoCounts(
  data: Course[]
): { date: string; num_convos: number }[] {
  const dateMap: Record<string, number> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const date = getDailyDateString(Number(firstMsg.timestamp));
        dateMap[date] = (dateMap[date] || 0) + 1;
      }
    }
  }
  return Object.entries(dateMap)
    .map(([date, num_convos]) => ({ date, num_convos }))
    .sort((a, b) => a.date.localeCompare(b.date));
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

export function getStudentDailyConvoLengths(
  data: Course[],
  studentSub: string
): { date: string; avg_convo_length: number }[] {
  const convos = getStudentConversations(data, studentSub);
  const dateMap: Record<string, { total: number; count: number }> = {};
  for (const convo of convos) {
    if (!convo.messages || convo.messages.length === 0) continue;
    const firstMsg = convo.messages[0];
    if (!firstMsg.timestamp) continue;
    const date = getDailyDateString(Number(firstMsg.timestamp));
    if (!dateMap[date]) dateMap[date] = { total: 0, count: 0 };
    dateMap[date].total += convo.messages.length;
    dateMap[date].count += 1;
  }
  return Object.entries(dateMap)
    .map(([date, { total, count }]) => ({
      date,
      avg_convo_length: count ? total / count : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getStudentDailyConvoCounts(
  data: Course[],
  studentSub: string
): { date: string; num_convos: number }[] {
  const convos = getStudentConversations(data, studentSub);
  const dateMap: Record<string, number> = {};
  for (const convo of convos) {
    if (!convo.messages || convo.messages.length === 0) continue;
    const firstMsg = convo.messages[0];
    if (!firstMsg.timestamp) continue;
    const date = getDailyDateString(Number(firstMsg.timestamp));
    dateMap[date] = (dateMap[date] || 0) + 1;
  }
  return Object.entries(dateMap)
    .map(([date, num_convos]) => ({ date, num_convos }))
    .sort((a, b) => a.date.localeCompare(b.date));
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
 * Returns the count of each conversation classification per day.
 * Output: Array of { date: string, classification: string, count: number }
 */
export function getDailyClassificationCounts(
  data: Course[]
): { date: string; classification: string; count: number }[] {
  const dateClassMap: Record<string, Record<string, number>> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const date = getDailyDateString(Number(firstMsg.timestamp));
        const classification = convo.classification || "(Unclassified)";
        if (!dateClassMap[date]) dateClassMap[date] = {};
        dateClassMap[date][classification] =
          (dateClassMap[date][classification] || 0) + 1;
      }
    }
  }
  // Flatten to array
  const result: { date: string; classification: string; count: number }[] = [];
  for (const date in dateClassMap) {
    for (const classification in dateClassMap[date]) {
      result.push({
        date,
        classification,
        count: dateClassMap[date][classification],
      });
    }
  }
  // Sort by date then classification
  return result.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.classification.localeCompare(b.classification);
  });
}

/**
 * Returns the count of conversations per module per day.
 * Output: Array of { date: string, moduleName: string, count: number }
 */
export function getDailyModuleUsage(
  data: Course[]
): { date: string; moduleName: string; count: number }[] {
  const dateModuleMap: Record<string, Record<string, number>> = {};
  for (const course of data) {
    if (!course.modules) continue;
    for (const module of course.modules) {
      const moduleName = module.name || "(No Name)";
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || convo.messages.length === 0) continue;
        const firstMsg = convo.messages[0];
        if (!firstMsg.timestamp) continue;
        const date = getDailyDateString(Number(firstMsg.timestamp));
        if (!dateModuleMap[date]) dateModuleMap[date] = {};
        dateModuleMap[date][moduleName] =
          (dateModuleMap[date][moduleName] || 0) + 1;
      }
    }
  }
  // Flatten to array
  const result: { date: string; moduleName: string; count: number }[] = [];
  for (const date in dateModuleMap) {
    for (const moduleName in dateModuleMap[date]) {
      result.push({
        date,
        moduleName,
        count: dateModuleMap[date][moduleName],
      });
    }
  }
  // Sort by date then moduleName
  return result.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
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
  dailyConvoLengths: { date: string; avg_convo_length: number }[];
  dailyConvoCounts: { date: string; num_convos: number }[];
  dailyClassificationCounts: {
    date: string;
    classification: string;
    count: number;
  }[];
  dailyModuleUsage: { date: string; moduleName: string; count: number }[];
  students: Record<
    string,
    {
      info: User;
      dailyConvoLengths: { date: string; avg_convo_length: number }[];
      dailyConvoCounts: { date: string; num_convos: number }[];
      totalMessages: number;
      moduleUsage: { moduleName: string; count: number }[];
      classificationCounts: { classification: string; count: number }[];
    }
  >;
} {
  // Wrap course in array to reuse existing functions
  const moduleUsageFrequency = getModuleUsageFrequency([course]);
  const dailyConvoLengths = getDailyConvoLengths([course]);
  const dailyConvoCounts = getDailyConvoCounts([course]);
  const dailyClassificationCounts = getDailyClassificationCounts([course]);
  const dailyModuleUsage = getDailyModuleUsage([course]);
  // Student-level analysis
  const students: Record<
    string,
    {
      info: User;
      dailyConvoLengths: { date: string; avg_convo_length: number }[];
      dailyConvoCounts: { date: string; num_convos: number }[];
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
      dailyConvoLengths: getStudentDailyConvoLengths([course], student.sub),
      dailyConvoCounts: getStudentDailyConvoCounts([course], student.sub),
      totalMessages,
      moduleUsage: getStudentModuleUsage([course], student.sub),
      classificationCounts: getStudentClassificationCounts(
        [course],
        student.sub
      ),
    };
  }
  const returnObj = {
    moduleUsageFrequency,
    dailyConvoLengths,
    dailyConvoCounts,
    dailyClassificationCounts,
    dailyModuleUsage,
    students,
  };
  return returnObj;
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
