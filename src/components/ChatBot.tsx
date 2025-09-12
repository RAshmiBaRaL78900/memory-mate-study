import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your educational AI assistant. I\'m here to help you learn and understand any topic. What would you like to explore today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: userMessage.content,
          conversationId: 'default'
        }
      });

      if (error) {
        throw error;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto">
        <Card className="flex-1 flex flex-col m-4">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Educational AI Chatbot
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      </div>
                      <div className="bg-secondary text-secondary-foreground rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything about your studies..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};