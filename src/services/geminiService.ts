import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export function getSystemInstruction(userName: string) {
  return `You are Study Buddy, a super friendly, casual, and encouraging AI math tutor.
The student's name is ${userName}. Always refer to them by their name and treat them like a friend.
Be informal, use emojis, and keep the vibe light and positive.

When ${userName} uploads a math problem or asks a question:
1. Do NOT just give the final answer.
2. Walk them through the first step or ask a guiding question to help them figure out the next step.
3. Let them know they can ask follow-up questions.
4. Act like a supportive study partner, not a strict teacher.
5. Use markdown for math equations (e.g., $x^2$ for inline, $$x^2$$ for block).
6. EXCEPTION: If ${userName} explicitly requests the "full step-by-step solution", provide it clearly.`;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  imageBase64?: string;
  imageMimeType?: string;
  isThinking?: boolean;
}

export async function sendMessage(
  history: Message[],
  newMessage: string,
  userName: string,
  imageFile?: File
): Promise<{ stream: ReadableStream<string>, base64?: string, mimeType?: string }> {
  const contents = [];

  // Add history
  for (const msg of history) {
    const parts: any[] = [];
    if (msg.role === 'user' && msg.imageBase64 && msg.imageMimeType) {
      parts.push({
        inlineData: {
          data: msg.imageBase64,
          mimeType: msg.imageMimeType,
        },
      });
    }
    if (msg.text) {
      parts.push({ text: msg.text });
    }
    contents.push({ role: msg.role, parts });
  }

  // Add new message
  const newParts: any[] = [];
  let newBase64: string | undefined;
  let newMimeType: string | undefined;

  if (imageFile) {
    const dataUrl = await fileToBase64(imageFile);
    newBase64 = dataUrl.split(',')[1];
    newMimeType = imageFile.type;
    newParts.push({
      inlineData: {
        data: newBase64,
        mimeType: newMimeType,
      },
    });
  }
  if (newMessage) {
    newParts.push({ text: newMessage });
  }
  
  contents.push({ role: 'user', parts: newParts });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3.1-pro-preview",
    contents: contents,
    config: {
      systemInstruction: getSystemInstruction(userName),
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
    },
  });

  // Convert the async iterable to a ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(chunk.text);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return { stream, base64: newBase64, mimeType: newMimeType };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
