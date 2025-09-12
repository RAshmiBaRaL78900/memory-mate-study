import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
}

export const MessageComponent: React.FC<MessageProps> = ({ content, role, timestamp }) => {
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-2 max-w-[80%] ${role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <Avatar className="w-8 h-8">
          <AvatarFallback className={role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
            {role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
        <div className={`rounded-lg p-3 ${role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <p className="text-sm whitespace-pre-wrap">{content}</p>
          {timestamp && (
            <p className={`text-xs mt-2 opacity-70 ${role === 'user' ? 'text-right' : 'text-left'}`}>
              {formatTimestamp(timestamp)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};