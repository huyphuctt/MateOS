
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

  public async generateWorkshopContent(
      task: 'outline' | 'draft' | 'refine' | 'summary',
      context: string,
      brief: string
  ): Promise<string> {
      let prompt = "";
      
      switch(task) {
          case 'outline':
              prompt = `Based on the following brief, create a structured outline. Use Markdown.\n\nBRIEF:\n${brief}\n\nCONTEXT FROM ANCESTORS:\n${context}`;
              break;
          case 'draft':
              prompt = `Expand the following context into a full prose draft. Follow the brief constraints. Use Markdown.\n\nBRIEF:\n${brief}\n\nOUTLINE/CONTEXT:\n${context}`;
              break;
          case 'refine':
              prompt = `Polish and refine the following text for tone, grammar, and flow. Retain the core message. Use Markdown.\n\nBRIEF:\n${brief}\n\nTEXT TO REFINE:\n${context}`;
              break;
          case 'summary':
              prompt = `Create an Executive Summary of the following content. Keep it high-level. Use Markdown.\n\nBRIEF:\n${brief}\n\nCONTENT:\n${context}`;
              break;
      }

      try {
          const response = await this.ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt
          });
          return response.text || "Failed to generate content.";
      } catch (error) {
          console.error("Workshop Gen Error:", error);
          return "Error generating workshop content. Please check API Key.";
      }
  }
}

export const geminiService = new GeminiService();
