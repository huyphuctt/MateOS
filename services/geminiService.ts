import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    const apiKey = process.env.API_KEY || '';
    // We instantiate lazily or safely handles missing key in UI
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async createChatSession() {
    this.chatSession = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are Copilot, a helpful MateOS AI assistant. Keep responses concise, friendly, and helpful. You can help with code, writing, or general questions.",
      },
    });
  }

  public async sendMessageStream(message: string): Promise<AsyncIterable<GenerateContentResponse>> {
    if (!this.chatSession) {
      await this.createChatSession();
    }
    
    if (!this.chatSession) {
        throw new Error("Failed to initialize chat session");
    }

    try {
      return await this.chatSession.sendMessageStream({ message });
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();