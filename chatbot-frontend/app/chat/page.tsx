'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { chatService, ChatMessage } from '@/lib/chat';
import { telemetry } from '@/lib/telemetry';
import Image from 'next/image';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, boolean | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Authentication check and connection
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Set up telemetry auth
    telemetry.setAuthToken(token);

    // Connect to WebSocket
    chatService.connect(token);
    setIsConnected(chatService.isConnected());

    // Set up event listeners
    const unsubscribeResponse = chatService.onResponse((response) => {
      setIsLoading(false);
      const assistantMessage: ChatMessage = {
        id: response.messageId || Date.now().toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: response.metadata,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Track bot response
      const source = response.metadata && 'source' in response.metadata
        ? (response.metadata.source as 'ai' | 'mock')
        : 'mock';
      telemetry.trackBotResponse(response.content, source);
    });

    const unsubscribeError = chatService.onError((error) => {
      console.error('Chat error:', error);
      setIsLoading(false);
    });

    // Request chat history
    chatService.requestHistory();

    return () => {
      unsubscribeResponse();
      unsubscribeError();
      chatService.disconnect();
      telemetry.destroy();
    };
  }, [router]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;


    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Send via WebSocket
    chatService.sendMessage(inputValue.trim());

    // Clear input
    setInputValue('');
    setIsTyping(false);
  }, [inputValue, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Track typing state for UI only
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      chatService.sendTypingIndicator(true);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (value.length > 0) {
        setIsTyping(false);
        chatService.sendTypingIndicator(false);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    telemetry.forceFlush();
    localStorage.removeItem('auth_token');
    chatService.disconnect();
    router.push('/auth');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFeedback = (messageId: string, isApproved: boolean) => {
    telemetry.trackFeedback(messageId, isApproved);
    setFeedbackMap(prev => ({ ...prev, [messageId]: isApproved }));
  };

  const getSourceBadge = (metadata?: Record<string, unknown>) => {
    if (!metadata || typeof metadata !== 'object') return null;
    const source = (metadata as { source?: string }).source;
    if (!source) return null;
    return (
      <Badge
        variant={source === 'ai' ? 'default' : 'secondary'}
        className="mt-2"
      >
        {source === 'ai' ? 'IA' : 'Bot'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto h-screen max-w-4xl px-4 py-4">
        <Card className="h-full shadow-2xl bg-white dark:bg-gray-900 flex flex-col">
          <div className="flex items-center justify-between border-b border-divider px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-white">
                <Image src="/handtalk.png" alt="Hand Talk" width={40} height={40} />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  Hand Talk Assistant
                </h1>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label="Sair do chat"
              className="text-destructive hover:text-destructive/80"
            >
              Sair
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-4 bg-gray-100 dark:bg-gray-800 p-4 min-h-0"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="mb-6 text-6xl">👋</div>
                <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                  Bem-vindo ao Hand Talk Chatbot!
                </h2>
                <p className="max-w-md text-gray-700 dark:text-gray-300 leading-relaxed">
                  Como posso ajudar você hoje? Você pode me perguntar sobre a Hand Talk,
                  nossos serviços, ou apenas bater um papo!
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-[80%] ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                    }`}
                >
                  <CardContent className="gap-1 px-4 py-3">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                      <div className="flex items-center gap-2">
                        {message.role === 'assistant' && getSourceBadge(message.metadata as Record<string, unknown> | undefined)}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleFeedback(message.id, true)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${feedbackMap[message.id] === true
                                ? 'text-green-500'
                                : 'text-gray-400 dark:text-gray-500'
                                }`}
                              aria-label="Aprovar resposta"
                              disabled={feedbackMap[message.id] !== undefined}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, false)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${feedbackMap[message.id] === false
                                ? 'text-red-500'
                                : 'text-gray-400 dark:text-gray-500'
                                }`}
                              aria-label="Reprovar resposta"
                              disabled={feedbackMap[message.id] !== undefined}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-white dark:bg-gray-700 shadow-md">
                  <CardContent className="flex items-center gap-3 px-4 py-3">
                    <Spinner className="size-4" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Digitando...</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 text-sm"
                disabled={isLoading}
                aria-label="Mensagem"
              />
              <Button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="px-4"
                aria-label="Enviar mensagem"
              >
                {isLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4 20-7z" />
                    <path d="M22 2 11 13" />
                  </svg>
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
              Pressione Enter para enviar • Dados de uso são coletados anonimamente
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
