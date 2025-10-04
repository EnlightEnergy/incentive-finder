import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [zipCode, setZipCode] = useState<string>();
  const [facilityType, setFacilityType] = useState<string>();
  const [utility, setUtility] = useState<string>();
  const [unrecognizedFacility, setUnrecognizedFacility] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (params: { message: string; zipCode?: string; facilityType?: string; utility?: string; unrecognizedFacility?: string }) => {
      const response = await apiRequest("POST", "/api/chat/message", {
        sessionId,
        message: params.message,
        zipCode: params.zipCode,
        facilityType: params.facilityType,
        utility: params.utility,
        unrecognizedFacility: params.unrecognizedFacility,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        role: "assistant",
        content: "Hello! I'm here to help you discover energy efficiency incentives for your California business. To get started, could you please share your facility's ZIP code?",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    let nextZipCode = zipCode;
    let nextFacilityType = facilityType;
    let nextUtility = utility;

    const zipMatch = inputMessage.match(/\b\d{5}\b/);
    if (zipMatch && !zipCode) {
      nextZipCode = zipMatch[0];
      setZipCode(nextZipCode);
    }

    const utilityPatterns = {
      'SCE': /\b(sce|southern california edison|so\.?\s*cal\.?\s*edison)\b/i,
      'PGE': /\b(pg&?e|pge|pacific gas & electric|pacific gas and electric|pacific gas)\b/i,
      'SDGE': /\b(sdg&?e|sdge|san diego gas & electric|san diego gas and electric|san diego gas)\b/i,
      'LADWP': /\b(ladwp|los angeles department of water & power|los angeles department of water and power|la\s*dept\.?\s*of\s*water|los angeles water|los angeles power)\b/i,
    };

    for (const [utilityKey, pattern] of Object.entries(utilityPatterns)) {
      if (pattern.test(inputMessage)) {
        nextUtility = utilityKey;
        setUtility(nextUtility);
        break;
      }
    }

    const facilityKeywords = {
      office: /\boffice\b/i,
      retail: /\bretail\b|\bstore\b|\bshop\b/i,
      restaurant: /\brestaurant\b|\bdining\b|\bcafe\b|\bbar\b/i,
      industrial: /\bindustrial\b|\bmanufacturing\b|\bwarehouse\b|\bfactory\b/i,
      hotel: /\bhotel\b|\blodging\b|\bmotel\b/i,
      medical: /\bmedical\b|\bhospital\b|\bclinic\b|\bdental\b/i,
      school: /\bschool\b|\beducation\b|\buniversity\b|\bcollege\b/i,
      recreation: /\bgolf\s*course\b|\brecreation\b|\bgym\b|\bfitness\b|\bsports\b|\bathletic\b/i,
      agriculture: /\bfarm\b|\bagriculture\b|\bvineyard\b|\bgreenhouse\b/i,
      multifamily: /\bapartment\b|\bmultifamily\b|\bcondo\b/i,
    };

    for (const [type, pattern] of Object.entries(facilityKeywords)) {
      if (pattern.test(inputMessage)) {
        // Allow facility type to be updated if user mentions a different one
        nextFacilityType = type;
        setFacilityType(nextFacilityType);
        break;
      }
    }

    // Check if user is responding with a facility category (for unrecognized facilities)
    const categoryPatterns = {
      retail: /^(retail|commercial|office)$/i,
      industrial: /^(industrial|manufacturing)$/i,
      multifamily: /^(multi-?family|residential|apartment)$/i,
    };

    for (const [type, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(inputMessage.trim())) {
        nextFacilityType = type;
        setFacilityType(nextFacilityType);
        setUnrecognizedFacility(undefined); // Clear unrecognized facility
        break;
      }
    }

    // Detect potential unrecognized facility mentions
    let detectedUnrecognized: string | undefined;
    if (!nextFacilityType && zipCode) {
      const facilityPatterns = [
        /(?:my|a|the|our)\s+([a-z\s]{3,30}?)(?:\s+(?:business|facility|building|center|location))?/i,
        /(?:incentives?\s+for\s+(?:my|a|the|our)\s+)([a-z\s]{3,30}?)(?:\?|$|\.)/i,
        /(?:I\s+have\s+a\s+)([a-z\s]{3,30}?)(?:\?|$|\.)/i,
      ];

      for (const pattern of facilityPatterns) {
        const match = inputMessage.match(pattern);
        if (match && match[1]) {
          const extracted = match[1].trim();
          // Don't capture generic words
          if (!['building', 'facility', 'business', 'location', 'place', 'property'].includes(extracted.toLowerCase())) {
            detectedUnrecognized = extracted;
            setUnrecognizedFacility(detectedUnrecognized);
            break;
          }
        }
      }
    }

    const currentMessage = inputMessage;
    setInputMessage("");
    
    const response = await chatMutation.mutateAsync({
      message: currentMessage,
      zipCode: nextZipCode,
      facilityType: nextFacilityType,
      utility: nextUtility,
      unrecognizedFacility: detectedUnrecognized || unrecognizedFacility,
    });

    if (response.utility && !nextUtility) {
      console.log("Detected utility from backend:", response.utility);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        data-testid="button-open-chat"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#0c558c] hover:bg-[#00a5cb] z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b bg-[#0c558c] text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold" data-testid="text-chat-title">Incentive Assistant</h3>
        </div>
        <Button
          data-testid="button-close-chat"
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white hover:bg-[#00a5cb]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              data-testid={`message-${message.role}-${idx}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-[#0c558c] text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            data-testid="input-chat-message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            data-testid="button-send-message"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || chatMutation.isPending}
            size="icon"
            className="bg-[#0c558c] hover:bg-[#00a5cb]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
