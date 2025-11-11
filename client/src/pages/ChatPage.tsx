import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Trash2, Lock, Unlock, Loader2, TrendingUp, DollarSign, Home, PiggyBank, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { chatAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}


interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [dataSharing, setDataSharing] = useState(false); // Default to OFF for privacy
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSession();
    loadSuggestions();
  }, []);

  // Reload session when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Chat] Page visible, reloading session...');
        loadSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async () => {
    try {
      const response = await chatAPI.getSession();
      setChatId(response.data.chatId);
      setMessages(response.data.messages || []);
      // Use the EXACT value from backend, don't default to true
      setDataSharing(response.data.dataSharing === true);
      console.log('[Chat] Loaded session with data sharing:', response.data.dataSharing);
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await chatAPI.getSuggestions();
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    console.log('[Chat] Sending message with data sharing:', dataSharing);

    try {
      const response = await chatAPI.sendMessage({
        message: text,
        chatId: chatId || undefined,
        dataSharing,
      });

      if (!chatId) {
        setChatId(response.data.chatId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message.content,
        timestamp: new Date(response.data.message.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Reload suggestions after each conversation
      loadSuggestions();
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear the chat history?')) return;

    try {
      await chatAPI.clearChat(chatId || undefined);
      setMessages([]);
      setChatId(null);
      loadSuggestions();
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleToggleDataSharing = async () => {
    const newValue = !dataSharing;
    console.log('[Chat] Toggling data sharing from', dataSharing, 'to', newValue);
    
    try {
      // Update backend FIRST
      await chatAPI.updateDataSharing({
        enabled: newValue,
        chatId: chatId || undefined,
      });
      
      // Only update frontend state after successful backend update
      setDataSharing(newValue);
      console.log('[Chat] Data sharing updated successfully to:', newValue);

      // Add system message about data sharing change
      const systemMessage: Message = {
        role: 'assistant',
        content: newValue
          ? '✅ Data sharing enabled! I now have access to your financial data and can provide personalized advice.'
          : '🔒 Data sharing disabled. I can still help with general financial advice, but responses won\'t be personalized to your specific situation.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    } catch (error) {
      console.error('Failed to update data sharing:', error);
      alert('Failed to update data sharing preference. Please try again.');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startListening = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permissions and try again.');
        } else if (event.error === 'no-speech') {
          alert('No speech detected. Please try speaking again.');
        } else {
          alert(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
      recognitionInstance.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      alert('Failed to start speech recognition. Please try again.');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser.');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold dark:text-white">AI Financial Assistant</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by Gemini AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Data Sharing Toggle */}
            <button
              onClick={handleToggleDataSharing}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dataSharing
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
              }`}
              title={dataSharing ? 'Data sharing enabled' : 'Data sharing disabled'}
            >
              {dataSharing ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span className="hidden sm:inline">Personalized</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Generic</span>
                </>
              )}
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold dark:text-white mb-2">
                Hello, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                I'm your AI financial assistant. Ask me anything about your finances, investments, or financial goals.
              </p>

              {/* Data Sharing Status */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                dataSharing
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {dataSharing ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Personalized mode active - I can access your financial data</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Generic mode - Enable data sharing for personalized advice</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white border border-gray-200 dark:border-dark-700'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        AI Assistant
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {dataSharing ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          Personalized
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          Generic
                        </span>
                      )}
                      {/* TTS Button for Assistant Messages */}
                      <button
                        onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                        className={`p-1 rounded transition-colors ${
                          isSpeaking
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-500 dark:text-gray-400'
                        }`}
                        title={isSpeaking ? 'Stop speaking' : 'Speak this message'}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 0 && suggestions.length > 0 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Suggested questions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all text-sm text-gray-700 dark:text-gray-300"
                  disabled={loading}
                >
                  <div className="flex items-center gap-2">
                    {index === 0 && <DollarSign className="w-4 h-4 text-primary-600" />}
                    {index === 1 && <Home className="w-4 h-4 text-green-600" />}
                    {index === 2 && <PiggyBank className="w-4 h-4 text-purple-600" />}
                    {index === 3 && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your finances..."
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={loading}
              />
            </div>

            {/* STT Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`p-3 rounded-xl transition-colors ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-400'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-dark-600 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
