// Type for a chat message
export interface ChatMessage {
  convId: string;
  role: string;
  content: string;
  preceding_ai?: string | null;
  preceding_human?: string | null;
  llm_category?: string | null;
  user_sub?: string | null;
}

// Extract all messages from nested structure
export function extractMessages(courses: unknown[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (const course of courses) {
    const courseObj = course as {
      modules?: {
        conversations?: {
          id: string;
          user?: { sub?: string };
          messages?: { role: string; content: string }[];
        }[];
      }[];
    };
    if (!courseObj.modules) continue;
    for (const module of courseObj.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages) continue;
        for (const msg of convo.messages) {
          messages.push({
            convId: convo.id,
            role: msg.role,
            content: msg.content,
            user_sub: convo.user?.sub ?? null,
          });
        }
      }
    }
  }
  return messages;
}

// Add context fields: preceding_ai and preceding_human
export function addContext(data: ChatMessage[]): ChatMessage[] {
  // Group by convId
  const grouped: { [convId: string]: ChatMessage[] } = {};
  data.forEach((msg) => {
    if (!grouped[msg.convId]) grouped[msg.convId] = [];
    grouped[msg.convId].push(msg);
  });
  // Sort each group by order in file (assume chronological)
  Object.values(grouped).forEach((group) => {
    for (let i = 0; i < group.length; i++) {
      group[i].preceding_ai =
        i > 0
          ? group[i - 1].role === "assistant"
            ? group[i - 1].content
            : null
          : null;
      group[i].preceding_human =
        i > 1
          ? group[i - 2].role === "user"
            ? group[i - 2].content
            : null
          : null;
    }
  });
  // Flatten back to array
  return Object.values(grouped).flat();
}

// OpenAI API setup
// WARNING: Never expose your OpenAI API key in production frontend code.
// This is for development/testing only.
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error(
    "VITE_OPENAI_API_KEY environment variable not set. Please check your .env file."
  );
}

// Full classification prompt
const CLASSIFY_PROMPT = `
You are reviewing a student's conversation with an AI writing assistant. The student is using this platform to learn and improve their writing.
Your task is to classify the *student's chat* (provided at the end) into one or more of the following categories:

## Categories ##
(1) **Request for Generation** – Asking AI to generate new content such as topics, outlines, paragraphs, or full write-ups.  
Examples: "Can you write my conclusion?", "Provide an outline in IMRaD format", "Make 3 subtopics based on this topic."

(2) **Request for Revision on What Student Wrote** – Asking AI to revise or rewrite content the *student* previously wrote. This often involves full delegation.  
Examples: "Fix this paragraph", "Make it sound better."

(3) **Request for Revision on What AI Wrote** – Asking AI to revise something it previously generated.  
Example: "Can you make the discussion section longer than the results section?" (in reference to AI's draft)

(4) **Language Use** – Requesting grammar, spelling, word choice correction, or sentence-level clarity improvements.  
Example: "Can you help fix my grammar?"

(5) **Request for Feedback & Evaluation** – Asking for the AI’s evaluation or opinion on their writing or ideas. It's mostly either asking for formative feedback or summative feedback and scores. 
Examples: "Is this a good thesis?", "How would you score this draft?"

(6) **Providing Context** – Supplying background or situational information to support the writing process.  
Examples: "I'm a senior", "The audience is undergraduate students", "This should be 2–3 pages long."

(7) **Be the Boss** – Actively engaging with AI’s previous output by questioning, evaluating, or building on it.  
Examples: "Can you be more concise?", "Why did you remove that sentence?", "Expand on the third option."

(8) **Request for Summary** – Asking AI to summarize a piece of writing.  
Example: "Here’s my draft, make a summary."

(9) **Draft** – Student provides a full or partial draft of an essay or assignment.

(10) **Outline** – Student provides a structural framework or skeleton of an essay.

(11) **Topics and Ideas** – Sharing general writing topics or brainstorming ideas.  
Example: "I’m thinking about writing on climate change and policy."

(12) **Class Information** – Sharing course-related details such as syllabi, assignment instructions, rubrics, or guidelines.

(13) **Search Engine Use** – Asking factual or conceptual questions unrelated to writing (using AI as a search tool).  
Example: "What do you think about the ethics of engineering?"

(14) **Off Task** – Irrelevant or distracting behavior unrelated to writing or coursework.  
Example: "Let’s play chess."

## Instructions ##
- Focus only on classifying the **current student chat**, not the preceding messages.
- Use the preceding two messages (one by the AI, one by the student) for context only.
- You may assign multiple categories if more than one clearly applies.
- Return only the category name(s), with no extra commentary.

## Conversation ##
### Preceding student chat: '{preceding_human}'
### Preceding AI chat: '{preceding_ai}'
### Current student chat: '{student_utterance}'
## End of Conversation ##
`;

// askGpt function similar to Python version
export async function askGpt(
  system: string,
  user: string,
  model: string,
  temperature: number
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Build the prompt for classification
export function buildPrompt(msg: ChatMessage): string {
  return CLASSIFY_PROMPT.replace("{preceding_human}", msg.preceding_human ?? "")
    .replace("{preceding_ai}", msg.preceding_ai ?? "")
    .replace("{student_utterance}", msg.content ?? "");
}

export async function classifyConversations(
  courses: unknown[],
  options?: {
    maxConversations?: number;
    model?: string;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<
  Array<{ convId: string; user_sub: string | null; llm_category: string }>
> {
  console.log(
    "[classifyConversations] Starting conversation-level classification..."
  );
  const conversations: {
    convId: string;
    user_sub: string | null;
    messages: { role: string; content: string }[];
  }[] = [];
  for (const course of courses) {
    const courseObj = course as {
      modules?: {
        conversations?: {
          id: string;
          user?: { sub?: string };
          messages?: { role: string; content: string }[];
        }[];
      }[];
    };
    if (!courseObj.modules) continue;
    for (const module of courseObj.modules) {
      if (!module.conversations) continue;
      for (const convo of module.conversations) {
        if (!convo.messages || !convo.id) continue;
        conversations.push({
          convId: convo.id,
          user_sub: convo.user?.sub ?? null,
          messages: convo.messages,
        });
      }
    }
  }
  console.log(
    "[classifyConversations] conversations.length:",
    conversations.length
  );
  let convs = conversations;
  if (options?.maxConversations) {
    convs = convs.slice(0, options.maxConversations);
  }
  const model = options?.model || "gpt-4o";
  const temperature = options?.temperature ?? 0.1;
  const systemPrompt =
    options?.systemPrompt ||
    "You are a helpful assistant that classifies entire student-AI conversations in writing-related platforms.";

  // Per-conversation classification
  const results: Array<{
    convId: string;
    user_sub: string | null;
    llm_category: string;
  }> = [];
  for (let i = 0; i < convs.length; i++) {
    const conv = convs[i];
    // Use the first message with role 'user' as the main student utterance, and the two preceding messages for context
    let mainMsgIdx = conv.messages.findIndex((m) => m.role === "user");
    if (mainMsgIdx === -1) mainMsgIdx = 0;
    const preceding_human =
      mainMsgIdx > 1 && conv.messages[mainMsgIdx - 2]?.role === "user"
        ? conv.messages[mainMsgIdx - 2].content
        : null;
    const preceding_ai =
      mainMsgIdx > 0 && conv.messages[mainMsgIdx - 1]?.role === "assistant"
        ? conv.messages[mainMsgIdx - 1].content
        : null;
    const student_utterance = conv.messages[mainMsgIdx]?.content ?? "";
    const msg: ChatMessage = {
      convId: conv.convId,
      role: "user",
      content: student_utterance,
      preceding_ai,
      preceding_human,
      user_sub: conv.user_sub,
    };
    const prompt = buildPrompt(msg);
    console.log(
      `[classifyConversations] Classifying convId=${conv.convId} (conv ${
        i + 1
      }/${convs.length})`
    );
    try {
      const llm_category = await askGpt(
        systemPrompt,
        prompt,
        model,
        temperature
      );
      console.log(
        `[classifyConversations] Success: convId=${conv.convId}, category=${llm_category}`
      );
      results.push({
        convId: conv.convId,
        user_sub: conv.user_sub,
        llm_category,
      });
    } catch {
      console.error(
        `[classifyConversations] Error classifying convId=${conv.convId}`
      );
      results.push({
        convId: conv.convId,
        user_sub: conv.user_sub,
        llm_category: "[Error: could not classify]",
      });
    }
  }
  console.log("[classifyConversations] Classification complete.");
  return results;
}

// This is how we call this function in App.tsx
export const handleClassifyConversations = async (
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setResults: (results: unknown) => void
) => {
  setLoading(true);
  setError(null);
  setResults(null);
  try {
    const modules = (await import("./testfiles/PapyrusAI_courses_test.json"))
      .default;
    const classified = await classifyConversations(modules, {
      temperature: 0.1,
    });
    setResults(classified);
  } catch (e: unknown) {
    if (e instanceof Error) {
      setError(e.message);
    } else {
      setError("Error loading or classifying conversations");
    }
  } finally {
    setLoading(false);
  }
};
