import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, BookOpen, Calculator, Code, Brain, HelpCircle } from 'lucide-react';

interface ChatSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
}

export const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ onSelectSuggestion }) => {
  const suggestions = [
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Explain a concept",
      description: "Help me understand quantum physics",
      prompt: "Can you explain quantum physics in simple terms?"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Study help",
      description: "Quiz me on history topics",
      prompt: "Can you create a quiz about World War II?"
    },
    {
      icon: <Calculator className="w-5 h-5" />,
      title: "Math problems",
      description: "Solve calculus equations",
      prompt: "Help me solve this calculus problem: find the derivative of x²+3x+2"
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: "Programming help",
      description: "Debug and explain code",
      prompt: "Explain how Python functions work with examples"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Critical thinking",
      description: "Analyze complex topics",
      prompt: "What are the pros and cons of renewable energy?"
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: "Ask anything",
      description: "I'm here to help learn",
      prompt: "What would you like to learn about today?"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {suggestions.map((suggestion, index) => (
        <Card
          key={index}
          className="p-4 cursor-pointer hover:bg-accent transition-colors border-2 hover:border-primary"
          onClick={() => onSelectSuggestion(suggestion.prompt)}
        >
          <div className="flex items-start space-x-3">
            <div className="text-primary mt-1">
              {suggestion.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{suggestion.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};