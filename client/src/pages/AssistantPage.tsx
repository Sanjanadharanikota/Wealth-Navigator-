import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Volume2, Loader2, TrendingUp, X } from 'lucide-react';
import { assistantAPI } from '../utils/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chartSuggestion?: any;
  sources?: any[];
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Add welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI financial assistant. I can help you understand your finances, plan for the future, and answer questions about your spending. Try asking me:\n\n• How much money will I have at 40?\n• Can I afford a ₹50L home loan?\n• Show my spending trend\n• Any unusual expenses this month?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await assistantAPI.query(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        chartSuggestion: response.data.chartSuggestion,
        sources: response.data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    }
  };

  const suggestedPrompts = [
    "How much will I have at 40?",
    "Can I afford a ₹50L loan?",
    "Show spending trends",
    "Any unusual expenses?",
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 py-6 flex-shrink-0">
        <h1 className="text-2xl font-bold dark:text-white mb-2">AI Assistant</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ask me anything about your finances
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-700 rounded-full"
                      >
                        {source.description}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {message.chartSuggestion && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-700">
                  <button 
                    onClick={() => {
                      // Navigate to the appropriate page based on chart type
                      const chartType = message.chartSuggestion.type;
                      if (chartType === 'expense-breakdown' || chartType === 'cashflow' || chartType === 'networth') {
                        window.location.href = '/dashboard';
                      } else {
                        window.location.href = '/insights';
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <TrendingUp className="w-4 h-4" />
                    View {message.chartSuggestion.type} chart
                  </button>
                </div>
              )}

              {message.role === 'assistant' && (
                <button
                  onClick={() => handleSpeak(message.content)}
                  className="mt-2 p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="px-4 py-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInput(prompt)}
                className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-full text-gray-700 dark:text-gray-300"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-700 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about your finances..."
              className="input-field pr-10 resize-none"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleVoiceInput}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Your financial data is securely processed and never shared with third parties
        </p>
      </div>
    </div>
  );
}