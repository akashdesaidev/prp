'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Loader2,
  Sparkles,
  HelpCircle,
  BookOpen,
  Lightbulb
} from 'lucide-react';
// Removed Button import - using regular HTML buttons for better compatibility
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

// Error boundary wrapper component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chatbot Error:', error, errorInfo);
    // Only hide chatbot for critical errors, not minor ones
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading')) {
      // These are likely network/loading issues, try to recover
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 5000);
    }
  }

  render() {
    if (this.state.hasError) {
      // Return a simple fallback icon instead of nothing
      return (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="h-14 w-14 rounded-full shadow-lg bg-gray-400 text-white border-2 border-white flex items-center justify-center opacity-50">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ProductChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content:
        "👋 Hi! I'm your Performance Review Platform assistant. I can help you understand how to use different features, guide you through processes, or answer questions about the platform. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const getContextualInfo = () => {
    const context = {
      currentPage: pathname || '/',
      userRole: user?.role || 'employee',
      userName: user ? `${user.firstName} ${user.lastName}` : 'User'
    };

    // Add page-specific context
    if (pathname?.includes('/okrs')) {
      context.currentFeature = 'OKRs & Goal Management';
    } else if (pathname?.includes('/feedback')) {
      context.currentFeature = 'Feedback System';
    } else if (pathname?.includes('/reviews')) {
      context.currentFeature = 'Performance Reviews';
    } else if (pathname?.includes('/analytics')) {
      context.currentFeature = 'Analytics & Reports';
    } else if (pathname?.includes('/time-tracking')) {
      context.currentFeature = 'Time Tracking';
    } else if (pathname?.includes('/departments') || pathname?.includes('/teams')) {
      context.currentFeature = 'Organization Management';
    } else if (pathname?.includes('/users')) {
      context.currentFeature = 'User Management';
    } else {
      context.currentFeature = 'Dashboard';
    }

    return context;
  };

  const quickActions = [
    {
      icon: BookOpen,
      text: 'How to create OKRs?',
      action: () => sendQuickMessage('How do I create and manage OKRs in the system?')
    },
    {
      icon: MessageCircle,
      text: 'Give feedback to colleagues',
      action: () => sendQuickMessage('How can I give feedback to my colleagues?')
    },
    {
      icon: Sparkles,
      text: 'Start a performance review',
      action: () => sendQuickMessage('How do I start or participate in a performance review?')
    },
    {
      icon: Lightbulb,
      text: 'Platform overview',
      action: () =>
        sendQuickMessage(
          'Can you give me an overview of all the features available in this platform?'
        )
    }
  ];

  const sendQuickMessage = (message) => {
    setInputMessage(message);
    setTimeout(() => sendMessage(message), 100);
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    // Security: Validate input before processing
    const validation = validateInput(messageText);
    if (!validation.isValid) {
      const securityMessage = {
        id: Date.now(),
        type: 'bot',
        content: validation.reason,
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, securityMessage]);
      setInputMessage('');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = getContextualInfo();
      const response = await api.post('/ai/chatbot', {
        message: messageText,
        context,
        conversationHistory: messages.slice(-5) // Send last 5 messages for context
      });

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.response,
        timestamp: new Date(),
        suggestions: response.data.suggestions || []
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content:
          "I'm sorry, I'm having trouble connecting right now. Here are some common things I can help with:\n\n• Creating and managing OKRs\n• Giving and receiving feedback\n• Performance review process\n• Time tracking features\n• Understanding analytics\n• User and organization management\n\nPlease try asking your question again, or contact support if the issue persists.",
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Chat cleared! How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  // Security: Input validation and content filtering
  const validateInput = (input) => {
    const blockedPatterns = [
      // Jailbreak attempts
      /ignore.{0,20}previous.{0,20}instructions?/i,
      /forget.{0,20}everything/i,
      /you.{0,20}are.{0,20}now/i,
      /pretend.{0,20}to.{0,20}be/i,
      /act.{0,20}as.{0,20}if/i,
      /role.{0,20}play/i,
      /system.{0,20}prompt/i,
      /override.{0,20}your/i,

      // Non-product related content
      /tell.{0,20}me.{0,20}a.{0,20}joke/i,
      /what.{0,20}is.{0,20}the.{0,20}weather/i,
      /write.{0,20}code.{0,20}for/i,
      /help.{0,20}me.{0,20}with.{0,20}homework/i,
      /personal.{0,20}advice/i,
      /relationship.{0,20}advice/i,

      // Prompt injection
      /\\n\\nuser:/i,
      /\\n\\nsystem:/i,
      /\\n\\nassistant:/i,
      /<\|.+\|>/i,
      /```.*system.*```/is
    ];

    // Check for blocked patterns
    for (const pattern of blockedPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          reason:
            "I'm designed to help specifically with the Performance Review Platform. Please ask questions about OKRs, feedback, reviews, time tracking, or other platform features."
        };
      }
    }

    // Check if message is about the product
    const platformKeywords = [
      'okr',
      'objective',
      'key result',
      'goal',
      'target',
      'feedback',
      'review',
      'performance',
      'evaluation',
      'assessment',
      'time',
      'tracking',
      'hours',
      'analytics',
      'dashboard',
      'report',
      'user',
      'team',
      'department',
      'manager',
      'employee',
      'role',
      'platform',
      'system',
      'feature',
      'how',
      'what',
      'where',
      'when',
      'why'
    ];

    const hasProductKeyword = platformKeywords.some((keyword) =>
      input.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasProductKeyword && input.length > 10) {
      return {
        isValid: false,
        reason:
          "I'm here to help with the Performance Review Platform. Please ask about features like OKRs, feedback, reviews, time tracking, or user management."
      };
    }

    return { isValid: true };
  };

  // More reliable authentication check with mounting state
  if (!isMounted || !user) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="relative">
          {/* Pulsing animation ring */}
          <div className="absolute inset-0 h-14 w-14 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-75 animate-pulse"></div>

          {/* Main button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-3 border-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl"
          >
            <MessageCircle className="w-6 h-6" />

            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </button>

          {/* Enhanced tooltip */}
          <div className="absolute -top-16 right-0 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none shadow-lg">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4" />
              <span>Hi! I'm your PRP Assistant</span>
            </div>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]">
      <div
        className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 flex flex-col ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[500px] max-h-[75vh] min-h-[400px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">PRP Assistant</h3>
              <p className="text-xs text-blue-100">Here to help with your performance goals</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded flex items-center justify-center"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.isError
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-2 space-y-1 max-w-full">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => sendQuickMessage(suggestion)}
                              className="block w-full text-left text-xs p-2 bg-white rounded border hover:bg-gray-50 text-gray-700 break-words"
                            >
                              <span className="truncate block">{suggestion}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
                <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                <div className="grid grid-cols-2 gap-1">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="flex items-center space-x-1 p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border min-w-0"
                    >
                      <action.icon className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-2">
                <div className="flex-1 relative min-w-0">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about the platform..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm max-h-20"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <button onClick={clearChat} className="text-xs text-gray-500 hover:text-gray-700">
                  Clear chat
                </button>
                <div className="text-xs text-gray-400">Press Enter to send</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Wrap with error boundary
const SafeProductChatbot = () => (
  <ErrorBoundary>
    <ProductChatbot />
  </ErrorBoundary>
);

export default SafeProductChatbot;
