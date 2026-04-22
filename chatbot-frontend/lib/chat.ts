import { io, Socket } from "socket.io-client";
import { puter } from "@heyputer/puter.js";
import { telemetry } from "./telemetry";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: object;
}

const HAND_TALK_SYSTEM_PROMPT = `Você é um assistente virtual especializado exclusivamente em assuntos relacionados à Hand Talk (https://www.handtalk.me/br).

Sobre a Hand Talk:
- Empresa brasileira fundada em 2012, pioneira em acessibilidade digital
- Oferece soluções de tradução automática para Libras (Língua Brasileira de Sinais), ASL (American Sign Language) e BSL (British Sign Language)
- Principais produtos:
  1. Hand Talk App - Aplicativo móvel eleito "Melhor Aplicativo Social do Mundo" pela ONU
     * Traduz textos, áudios e imagens para Libras
     * Usa o avatar Hugo (personagem masculino) e Maya (personagem feminina)
     * Possui +10 milhões de downloads
     * Inclui dicionário de termos e série #HugoEnsina
  2. Hand Talk Plugin - Solução para sites empresariais
     * +1000 sites utilizam
     * +50 milhões de palavras traduzidas por mês
     * +15 milhões de pessoas usuárias anualmente
     * Inclui relatórios de desempenho e garantia de compliance
  3. HT Academy - Plataforma de ensino de Libras

- Tecnologia: Usa Inteligência Artificial para tradução automática
- Impacto: Conecta empresas à comunidade surda e PCDs (Pessoas com Deficiência)
- Reconhecimentos: Premiada pelo Google (R$ 5 milhões no Desafio Google de Impacto em IA) e pela ONU

REGRAS IMPORTANTES:
1. Responda APENAS perguntas relacionadas à Hand Talk, seus produtos, serviços, tecnologia, acessibilidade, Libras, surdez ou inclusão
2. Se o usuário perguntar sobre assuntos NÃO relacionados (clima, esportes, notícias gerais, etc.), responda educadamente: "Desculpe, sou especializado apenas em assuntos relacionados à Hand Talk e acessibilidade. Posso ajudar com informações sobre nossos produtos, Libras, ou tecnologias assistivas?"
3. Seja sempre amigável, prestativo e conciso
4. Direcione o usuário para handtalk.me quando apropriado`;

export class ChatService {
  private socket: Socket | null = null;
  private apiUrl: string;
  private messageListeners: ((message: ChatMessage) => void)[] = [];
  private responseListeners: ((response: {
    content: string;
    metadata?: object;
    messageId?: string;
  }) => void)[] = [];
  private typingListeners: ((data: {
    userId: string;
    typing: boolean;
  }) => void)[] = [];
  private errorListeners: ((error: { message: string }) => void)[] = [];
  private chatHistory: { role: string; content: string }[] = [];

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  }

  connect(token: string, sessionId?: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(`${this.apiUrl}/chat`, {
      auth: {
        token,
        sessionId,
      },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      // Connection established - no specific telemetry needed
    });

    this.socket.on("session", (data: { sessionId: string }) => {
      telemetry.setSessionId(data.sessionId);
    });

    this.socket.on(
      "chat:response",
      (data: {
        content: string;
        metadata?: Record<string, unknown>;
        timestamp: string;
        messageId?: string;
      }) => {
        if (!data.content || data.metadata?.["frontend"]) {
          return;
        }

        const source =
          data.metadata && "source" in data.metadata
            ? (data.metadata.source as "ai" | "mock")
            : "mock";
        telemetry.trackBotResponse(data.content, source);

        this.responseListeners.forEach((listener) => listener(data));
      },
    );

    this.socket.on(
      "user:typing",
      (data: { userId: string; typing: boolean }) => {
        this.typingListeners.forEach((listener) => listener(data));
      },
    );

    this.socket.on("chat:history", (data: { messages: ChatMessage[] }) => {
      this.chatHistory = data.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      data.messages.forEach((msg) => {
        this.messageListeners.forEach((listener) => listener(msg));
      });
    });

    this.socket.on("error", (error: { message: string }) => {
      this.errorListeners.forEach((listener) => listener(error));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.chatHistory = [];
  }

  async sendMessage(content: string) {
    if (!this.socket?.connected) return;

    const startTime = Date.now();

    this.socket.emit("chat:message", { content });

    telemetry.trackUserMessage(content);

    try {
      const historyForAI = this.chatHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10);

      const result = await puter.ai.chat(
        [
          { role: "system", content: HAND_TALK_SYSTEM_PROMPT },
          ...historyForAI,
          { role: "user", content },
        ],
        { model: "inclusionai/ling-2.6-flash:free" },
      );

      const messageContent = result.message?.content;
      let responseContent: string;

      if (typeof messageContent === "string") {
        responseContent = messageContent;
      } else if (Array.isArray(messageContent)) {
        let foundText = "";
        for (const c of messageContent as unknown as {
          type?: string;
          text?: string;
        }[]) {
          if (c.type === "text") {
            foundText = c.text || "";
            break;
          }
        }
        responseContent = foundText || "Desculpe, não consegui processar sua mensagem.";
      } else {
        responseContent = "Desculpe, não consegui processar sua mensagem.";
      }

      this.chatHistory.push({ role: "user", content });
      this.chatHistory.push({ role: "assistant", content: responseContent });

      this.socket.emit("chat:save", { role: "assistant", content: responseContent });

      const responseTimeMs = Date.now() - startTime;
      telemetry.trackBotResponse(responseContent, "ai", responseTimeMs);

      this.responseListeners.forEach((listener) =>
        listener({
          content: responseContent,
          metadata: { provider: "puter", framework: "puter.js" },
        }),
      );
    } catch (error) {
      console.error("Puter.js API error:", error);
      const errorMessage = "Desculpe, ocorreu um erro ao processar sua mensagem.";
      telemetry.trackBotResponse(errorMessage, "mock", Date.now() - startTime);
      this.responseListeners.forEach((listener) =>
        listener({
          content: errorMessage,
          metadata: { source: "mock", error: "puter_api_error" },
        }),
      );
    }
  }

  sendTypingIndicator(typing: boolean) {
    this.socket?.emit("chat:typing", { typing });
  }

  requestHistory() {
    this.socket?.emit("chat:history");
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(
        (l) => l !== callback,
      );
    };
  }

  onResponse(
    callback: (response: {
      content: string;
      metadata?: object;
      messageId?: string;
    }) => void,
  ) {
    this.responseListeners.push(callback);
    return () => {
      this.responseListeners = this.responseListeners.filter(
        (l) => l !== callback,
      );
    };
  }

  onTyping(callback: (data: { userId: string; typing: boolean }) => void) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter((l) => l !== callback);
    };
  }

  onError(callback: (error: { message: string }) => void) {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatService = new ChatService();