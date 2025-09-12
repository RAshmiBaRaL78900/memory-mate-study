import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { ChatSuggestions } from '@/components/ChatSuggestions';
import { MessageComponent } from '@/components/MessageComponent';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setConversations(data || []);
      
      // Auto-select the most recent conversation if none selected
      if (data && data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      // Type cast the role field to ensure TypeScript compatibility
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      }));
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error", 
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const createNewConversation = async (firstMessage?: string) => {
    try {
      const title = firstMessage 
        ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'New Chat';
        
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title })
        .select('id, title, updated_at')
        .single();
      
      if (error) throw error;
      
      const newConversation = data;
      setConversations([newConversation, ...conversations]);
      setCurrentConversationId(newConversation.id);
      
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);
      
      if (error) throw error;
      
      setConversations(conversations.map(conv => 
        conv.id === conversationId ? { ...conv, title } : conv
      ));
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const saveMessage = async (conversationId: string, content: string, role: 'user' | 'assistant') => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          role,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input;
    if (!messageToSend.trim()) return;

    let conversationId = currentConversationId;
    
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = await createNewConversation(messageToSend);
      if (!conversationId) return;
    }

    // Save user message
    const savedUserMessage = await saveMessage(conversationId, messageToSend, 'user');
    if (!savedUserMessage) return;

    if (!messageText) setInput('');
    setLoading(true);

    // Add user message to UI (with type casting)
    setMessages(prev => [...prev, { ...savedUserMessage, role: savedUserMessage.role as 'user' | 'assistant' }]);

    // Update conversation title if it's the first message
    if (messages.length === 0) {
      const title = messageToSend.slice(0, 50) + (messageToSend.length > 50 ? '...' : '');
      updateConversationTitle(conversationId, title);
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { 
          message: messageToSend,
          conversationId: conversationId
        }
      });

      if (error) {
        console.error('Error calling chat function:', error);
        throw error;
      }

      // Save assistant message
      const savedAssistantMessage = await saveMessage(conversationId, data.message, 'assistant');
      if (savedAssistantMessage) {
        setMessages(prev => [...prev, { ...savedAssistantMessage, role: savedAssistantMessage.role as 'user' | 'assistant' }]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant' as const,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = async () => {
    const newId = await createNewConversation();
    if (newId) {
      setMessages([]);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
      
      setConversations(conversations.filter(conv => conv.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        const remaining = conversations.filter(conv => conv.id !== conversationId);
        setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
      
      toast({
        title: "Success",
        description: "Conversation deleted",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const handleClearChat = async () => {
    if (!currentConversationId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', currentConversationId);
      
      if (error) throw error;
      
      setMessages([]);
      toast({
        title: "Success", 
        description: "Chat cleared",
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        loading={loadingConversations}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col m-4 ml-0">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Educational AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Ask me anything and I'll help you learn!</p>
            </div>
            {currentConversationId && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={loading || messages.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadMessages(currentConversationId)}
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
          
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {!currentConversationId || messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                {!currentConversationId ? (
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Welcome to AI Chat</h2>
                    <p className="text-muted-foreground mb-6">Select a conversation or start a new one to begin chatting</p>
                    <Button onClick={handleNewConversation}>
                      Start New Chat
                    </Button>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-2">Let's start learning!</h2>
                      <p className="text-muted-foreground mb-6">Choose a topic below or ask me anything</p>
                    </div>
                    <ChatSuggestions onSelectSuggestion={handleSendMessage} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageComponent
                    key={message.id}
                    content={message.content}
                    role={message.role}
                    timestamp={new Date(message.created_at)}
                  />
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          {/* Input Area */}
          {currentConversationId && (
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};