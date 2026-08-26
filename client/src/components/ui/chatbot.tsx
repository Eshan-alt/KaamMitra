import { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, ChevronDown, ChevronUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm Kaam Mitra's AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const openChat = () => setIsOpen(true);
    window.addEventListener("open-kaam-mitra-chat", openChat);
    return () => window.removeEventListener("open-kaam-mitra-chat", openChat);
  }, []);

  const handleUserInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await apiRequest("POST", "/api/chatbot/message", {
        message: userMessage.content,
      });
      
      const data = await response.json();
      
      // Add AI response to chat
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Floating button to open chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-full shadow-lg hover:shadow-purple-300/50 transition-all duration-300 z-50 flex items-center group"
      >
        <MessageSquare className="h-6 w-6" />
        <span className={`${isOpen ? "hidden" : "hidden md:block"} ml-2 overflow-hidden transition-all duration-300 whitespace-nowrap ${isOpen ? "w-0" : "group-hover:w-24"}`}>
          Get Help
        </span>
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 w-full sm:w-96 h-[30rem] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 border-2 border-purple-200"
            id="kaam-mitra-chat"
          >
            {/* Chat header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <MessageSquare className="h-6 w-6 text-white mr-2" />
                <h3 className="text-white font-semibold">Kaam Mitra Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages container */}
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-4 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-4">
                  <div className="inline-block rounded-lg px-4 py-2 bg-white text-gray-800 border border-gray-200 shadow-sm max-w-[80%]">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleUserInput} className="p-3 border-t bg-white">
              <div className="flex">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 rounded-r-lg hover:from-purple-700 hover:to-pink-600 transition-colors disabled:opacity-50"
                  disabled={isLoading || !userInput.trim()}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}