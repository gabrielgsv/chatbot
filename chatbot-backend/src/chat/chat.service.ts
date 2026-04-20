import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, MessageRole } from './entities/message.entity';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

export interface ChatResponse {
  content: string;
  metadata?: object;
  messageId?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private model: ChatOpenAI | null = null;
  private chain: RunnableSequence | null = null;

  private readonly HAND_TALK_SYSTEM_PROMPT = `Você é um assistente virtual especializado exclusivamente em assuntos relacionados à Hand Talk (https://www.handtalk.me/br).

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

  constructor(
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('NVIDIA_API_KEY');
    if (apiKey) {
      this.model = new ChatOpenAI({
        apiKey,
        modelName: 'moonshotai/kimi-k2-instruct-0905',
        temperature: 0.6,
        topP: 0.9,
        maxTokens: 4096,
        configuration: {
          baseURL: 'https://integrate.api.nvidia.com/v1',
        },
      });

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', this.HAND_TALK_SYSTEM_PROMPT],
        ['human', '{input}'],
      ]);

      this.chain = RunnableSequence.from([
        prompt,
        this.model,
        new StringOutputParser(),
      ]);
      this.logger.log('LangChain agent initialized with NVIDIA API');
    } else {
      this.logger.warn('NVIDIA API key not configured, using mock responses');
    }
  }

  async saveMessage(
    userId: string,
    role: MessageRole,
    content: string,
    sessionId?: string,
  ): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      userId,
      role,
      content,
      sessionId,
    });

    return this.messageRepository.save(message);
  }

  async getChatHistory(
    userId: string,
    sessionId?: string,
    limit = 50,
  ): Promise<ChatMessage[]> {
    const qb = this.messageRepository
      .createQueryBuilder('message')
      .where('message.userId = :userId', { userId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (sessionId) {
      qb.andWhere('message.sessionId = :sessionId', { sessionId });
    }

    return qb.getMany();
  }

  async generateResponse(
    userId: string,
    message: string,
    sessionId?: string,
  ): Promise<ChatResponse> {
    await this.saveMessage(userId, MessageRole.USER, message, sessionId);

    let responseContent: string;
    let metadata: object = {};

    if (this.chain) {
      try {
        const chainResult = (await this.chain.invoke({
          input: message,
        })) as string;
        responseContent = chainResult;
        metadata = {
          model: 'moonshotai/kimi-k2-instruct-0905',
          provider: 'nvidia',
          framework: 'langchain',
        };
      } catch (error) {
        this.logger.error('LangChain/NVIDIA API error:', error);
        responseContent = this.getMockResponse(message);
        metadata = { source: 'mock', error: 'langchain_api_error' };
      }
    } else {
      responseContent = this.getMockResponse(message);
      metadata = { source: 'mock', reason: 'no_api_key' };
    }

    const savedMessage = await this.saveMessage(
      userId,
      MessageRole.ASSISTANT,
      responseContent,
      sessionId,
    );

    return { content: responseContent, metadata, messageId: savedMessage.id };
  }

  private getMockResponse(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (
      lowerMsg.includes('oi') ||
      lowerMsg.includes('olá') ||
      lowerMsg.includes('ola')
    ) {
      return 'Olá! Como posso ajudar você hoje?';
    }
    if (lowerMsg.includes('ajuda') || lowerMsg.includes('help')) {
      return 'Claro! Estou aqui para ajudar. O que você precisa?';
    }
    if (lowerMsg.includes('hand talk') || lowerMsg.includes('handtalk')) {
      return 'A Hand Talk é uma empresa que usa tecnologia e IA para quebrar barreiras de comunicação, especialmente com a comunidade surda!';
    }
    if (lowerMsg.includes('surd') || lowerMsg.includes('libras')) {
      return 'A Hand Talk trabalha com tecnologia de tradução automática de Libras usando nosso avatar, o Hugo.';
    }
    if (lowerMsg.includes('obrigad')) {
      return 'Por nada! Estou sempre aqui se precisar de mais ajuda.';
    }

    return 'Entendi! É um tema interessante. Posso ajudar com mais informações sobre a Hand Talk ou nossos serviços?';
  }
}
