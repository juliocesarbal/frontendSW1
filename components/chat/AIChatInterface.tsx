'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, X, Lightbulb } from 'lucide-react';
import { aiAPI } from '@/lib/api';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIChatInterfaceProps {
  diagramId: string;
  onUMLGenerated?: (umlModel: any) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const examplePrompts = [
  "Create an e-commerce system with products, categories, and users",
  "Design a library management system with books, authors, and borrowers",
  "Build a blog platform with posts, comments, and tags",
  "Create a restaurant ordering system with menus, orders, and customers",
  "Design a social media platform with users, posts, and relationships"
];

export default function AIChatInterface({ diagramId, onUMLGenerated, onClose, isOpen }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 Hi! I\'m your UML AI assistant. I can help you create class diagrams from natural language descriptions. Try describing a system you want to model!',
      timestamp: new Date(),
      suggestions: examplePrompts.slice(0, 3)
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // First, get AI response
      const chatResponse = await aiAPI.chat(text);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: chatResponse.response,
        timestamp: new Date(),
        suggestions: chatResponse.suggestions,
      };

      setMessages(prev => [...prev, aiMessage]);

      // If the prompt seems like it wants UML generation, try to generate it
      if (text.toLowerCase().includes('create') ||
          text.toLowerCase().includes('design') ||
          text.toLowerCase().includes('build') ||
          text.toLowerCase().includes('generate')) {

        try {
          const umlResponse = await aiAPI.generateUML(text, diagramId);

          if (umlResponse.success && umlResponse.model) {
            const umlMessage: ChatMessage = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `✨ Great! I've generated a UML model for "${umlResponse.model.name}". Click the button below to apply it to your diagram.`,
              timestamp: new Date(),
            };

            setMessages(prev => [...prev, umlMessage]);

            // Call the callback to update the diagram
            if (onUMLGenerated) {
              onUMLGenerated(umlResponse.model);
            }
          }
        } catch (umlError) {
          console.error('UML generation error:', umlError);
          const errorMessage: ChatMessage = {
            id: (Date.now() + 3).toString(),
            type: 'ai',
            content: '⚠️ I had trouble generating the UML model. Could you please be more specific about the entities and their relationships?',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '😅 Sorry, I\'m having trouble right now. Please try again in a moment.',
        timestamp: new Date(),
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

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <h3 className="font-semibold">UML AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <Bot size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <User size={16} className="text-white mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <Lightbulb size={12} />
                        <span>Try these examples:</span>
                      </div>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(suggestion)}
                          className="block w-full text-left text-xs p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot size={16} className="text-purple-600" />
                <Loader2 size={16} className="animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your UML diagram..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-2 rounded-md transition-colors ${
              !inputMessage.trim() || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-center mt-2">
          <button
            onClick={() => handleSendMessage("Create a simple e-commerce system")}
            className="text-xs text-purple-600 hover:text-purple-800 transition-colors flex items-center space-x-1"
            disabled={isLoading}
          >
            <Sparkles size={12} />
            <span>Quick: E-commerce example</span>
          </button>
        </div>
      </div>
    </div>
  );
}