import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Building2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import chatbotIconPath from "@assets/CHATBOT ICON_1759686674784.png";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface SearchModePrompt {
  show: boolean;
  timestamp: string;
}

interface LeadCapturePrompt {
  show: boolean;
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
  const [measure, setMeasure] = useState<string>();
  const [searchMode, setSearchMode] = useState<string>();
  const [leadCaptureState, setLeadCaptureState] = useState(false);
  const [showSearchModePrompt, setShowSearchModePrompt] = useState<SearchModePrompt>({ show: false, timestamp: "" });
  const [showLeadCaptureForm, setShowLeadCaptureForm] = useState<LeadCapturePrompt>({ show: false, timestamp: "" });
  const [leadFormData, setLeadFormData] = useState({ company: "", contactName: "", email: "", phone: "" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const leadFormRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (params: { message: string; zipCode?: string; facilityType?: string; utility?: string; unrecognizedFacility?: string; measure?: string; searchMode?: string }) => {
      const response = await apiRequest("POST", "/api/chat/message", {
        sessionId,
        message: params.message,
        zipCode: params.zipCode,
        facilityType: params.facilityType,
        utility: params.utility,
        unrecognizedFacility: params.unrecognizedFacility,
        measure: params.measure,
        searchMode: params.searchMode,
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

  // Scroll to top of lead form when it appears
  useEffect(() => {
    if (showLeadCaptureForm.show && leadFormRef.current) {
      leadFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showLeadCaptureForm.show]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        role: "assistant",
        content: "Hello! I'm WattSon Incentive AI. I help California businesses discover energy efficiency incentives. To get started, could you please share your facility's ZIP code?",
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
    let nextMeasure = measure;
    let nextSearchMode = searchMode;
    let nextUnrecognizedFacility = unrecognizedFacility;

    const zipMatch = inputMessage.match(/\b\d{5}\b/);
    let isNewZipDetected = false;
    if (zipMatch) {
      const newZip = zipMatch[0];
      // If this is a different ZIP, reset the entire conversation flow
      if (newZip !== zipCode) {
        isNewZipDetected = true;
        nextZipCode = newZip;
        setZipCode(nextZipCode);
        // Reset all conversation state including utility and unrecognized facility
        nextFacilityType = undefined;
        nextUtility = undefined;
        nextMeasure = undefined;
        nextSearchMode = undefined;
        nextUnrecognizedFacility = undefined;
        setFacilityType(undefined);
        setUtility(undefined);
        setMeasure(undefined);
        setSearchMode(undefined);
        setUnrecognizedFacility(undefined);
        setShowLeadCaptureForm({ show: false, timestamp: "" });
        setLeadCaptureState(false);
      } else {
        nextZipCode = newZip;
        setZipCode(nextZipCode);
      }
    }

    // Don't detect utility if we just detected a new ZIP - let the flow restart
    if (!isNewZipDetected) {
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
    }

    // Don't detect facility, measure, or search mode if we just detected a new ZIP - let the flow restart
    if (!isNewZipDetected) {
      const facilityKeywords = {
        office: /\boffice\b/i,
        retail: /\bretail\b|\bstore\b|\bshop\b/i,
        restaurant: /\brestaurant\b|\bdining\b|\bcafe\b|\bbar\b/i,
        industrial: /\bindustrial\b|\bmanufacturing\b|\bfactory\b/i,
        warehouse: /\bwarehousing\b|\bwarehouse\b|\bdistribution\s*center\b|\bstorage\b/i,
        hotel: /\bhotel\b|\blodging\b|\bmotel\b/i,
        medical: /\bhealthcare\b|\bhospital\b|\bclinic\b|\bmedical\b|\bnursing\s*home\b|\bassisted\s*living\b|\bdental\b/i,
        school: /\bschool\b|\beducation\b|\buniversity\b|\bcollege\b/i,
        recreation: /\bgolf\s*course\b|\brecreation\b|\bgym\b|\bfitness\b|\bsports\b|\bathletic\b/i,
        agriculture: /\bfarm\b|\bagriculture\b|\bvineyard\b|\bgreenhouse\b/i,
        multifamily: /\bapartment\b|\bmultifamily\b|\bcondo\b/i,
        foodprocessing: /\bfood\s*processing\b|\bprocessing\s*facility\b/i,
        autodealer: /\bauto\s*dealer\b|\bcar\s*dealer\b/i,
        grocery: /\bgrocery\b|\bsupermarket\b|\bconvenience\s*store\b/i,
      };

      for (const [type, pattern] of Object.entries(facilityKeywords)) {
        if (pattern.test(inputMessage)) {
          nextFacilityType = type;
          setFacilityType(nextFacilityType);
          break;
        }
      }

      // Detect measures from user message
      const measureKeywords = {
        'LED': /\bled\b|\blighting\b|\blights\b|\blamp\b/i,
        'HVAC': /\bhvac\b|\bheating\b|\bcooling\b|\bair\s*conditioning\b|\bfurnace\b|\bboiler\b/i,
        'Heat Pump': /\bheat\s*pump\b|\bhp\s*water\s*heater\b|\bhpwh\b/i,
        'Solar': /\bsolar\b|\bpv\b|\bphotovoltaic\b/i,
        'Insulation': /\binsulation\b|\bweatherization\b/i,
        'Motors': /\bmotor\b|\bvfd\b|\bvariable\s*frequency\s*drive\b/i,
        'Refrigeration': /\brefrigeration\b|\bcooler\b|\bfreezer\b/i,
      };

      for (const [measureType, pattern] of Object.entries(measureKeywords)) {
        if (pattern.test(inputMessage)) {
          nextMeasure = measureType;
          setMeasure(nextMeasure);
          break;
        }
      }

      // Detect search mode from user message
      if (/\b(measure|specific\s*measure|energy\s*saving\s*measure)\b/i.test(inputMessage)) {
        nextSearchMode = 'measure';
        setSearchMode(nextSearchMode);
      } else if (/\b(building\s*type|facility\s*type|my\s*building)\b/i.test(inputMessage)) {
        nextSearchMode = 'buildingType';
        setSearchMode(nextSearchMode);
      }
    }

    // Detect affirmative responses for lead capture
    const affirmativePattern = /^(yes|yeah|sure|ok|okay|yep|yup|absolutely|definitely|sounds\s*good)$/i;
    if (affirmativePattern.test(inputMessage.trim())) {
      // Check if previous message was asking about consultation
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage && /\b(consultation|schedule|speak with|contact)\b/i.test(lastAssistantMessage.content)) {
        setLeadCaptureState(true);
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
    // Only detect if not a new ZIP and we don't already have a facility
    let detectedUnrecognized: string | undefined;
    if (!isNewZipDetected && !nextFacilityType && nextZipCode) {
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
            nextUnrecognizedFacility = detectedUnrecognized;
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
      unrecognizedFacility: detectedUnrecognized || nextUnrecognizedFacility,
      measure: nextMeasure,
      searchMode: nextSearchMode,
    });

    // Update detected values from backend
    if (response.detectedZip && response.detectedZip !== nextZipCode) {
      setZipCode(response.detectedZip);
    }
    if (response.utility && response.utility !== nextUtility) {
      console.log("Detected utility from backend:", response.utility);
      setUtility(response.utility);
    }
    if (response.detectedFacility && response.detectedFacility !== nextFacilityType) {
      setFacilityType(response.detectedFacility);
    }
    if (response.detectedMeasure && response.detectedMeasure !== nextMeasure) {
      setMeasure(response.detectedMeasure);
    }

    // Check if backend indicates we should show search mode selector
    if (response.showSearchModeSelector && !nextSearchMode) {
      setShowSearchModePrompt({ show: true, timestamp: new Date().toISOString() });
    }

    // Update lead capture form visibility based on backend response
    // The backend is the source of truth for when to show the form
    if (response.showLeadCapture) {
      setShowLeadCaptureForm({ show: true, timestamp: new Date().toISOString() });
    } else {
      setShowLeadCaptureForm({ show: false, timestamp: "" });
    }
  };

  const handleSearchModeSelect = async (mode: 'measure' | 'buildingType') => {
    setSearchMode(mode);
    setShowSearchModePrompt({ show: false, timestamp: "" });
    
    const modeMessage = mode === 'measure' 
      ? 'I want to search by energy saving measure'
      : 'I want to search by building type';
    
    const userMessage: Message = {
      role: "user",
      content: modeMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    await chatMutation.mutateAsync({
      message: modeMessage,
      zipCode,
      facilityType,
      utility,
      measure,
      searchMode: mode,
    });
  };

  const handleLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiRequest("POST", "/api/leads", leadFormData);
      
      const successMessage: Message = {
        role: "assistant",
        content: "Thank you! We've received your information. One of our energy efficiency experts will be in touch with you shortly to discuss your incentive opportunities.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, successMessage]);
      setShowLeadCaptureForm({ show: false, timestamp: "" });
      setLeadFormData({ company: "", contactName: "", email: "", phone: "" });
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "I apologize, but there was an error submitting your information. Please try again or contact us directly.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
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
      <button
        data-testid="button-open-chat"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 hover:scale-110 z-50 cursor-pointer border-none bg-transparent p-0 transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(12,85,140,0.6)]"
      >
        <img src={chatbotIconPath} alt="WattSon Incentive AI" className="h-full w-full" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b bg-[#0c558c] text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <img src={chatbotIconPath} alt="WattSon" className="h-8 w-8 rounded-full" />
          <h3 className="font-semibold" data-testid="text-chat-title">WattSon Incentive AI</h3>
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
          
          {showSearchModePrompt.show && (
            <div className="flex justify-start">
              <div className="bg-blue-50 border-2 border-[#0c558c] rounded-lg p-4 max-w-[85%]" data-testid="search-mode-selector">
                <p className="text-sm font-semibold mb-3 text-slate-900">How would you like to search for incentives?</p>
                <div className="flex flex-col gap-2">
                  <Button
                    data-testid="button-search-by-measure"
                    onClick={() => handleSearchModeSelect('measure')}
                    className="w-full bg-[#0c558c] hover:bg-[#00a5cb] text-white flex items-center gap-2 justify-start"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>Search by Energy Measure</span>
                  </Button>
                  <Button
                    data-testid="button-search-by-building"
                    onClick={() => handleSearchModeSelect('buildingType')}
                    className="w-full bg-[#0c558c] hover:bg-[#00a5cb] text-white flex items-center gap-2 justify-start"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Search by Building Type</span>
                  </Button>
                </div>
                <p className="text-xs mt-2 text-slate-600 italic">Click one of the options above</p>
              </div>
            </div>
          )}
          
          {showLeadCaptureForm.show && (
            <div className="flex justify-start" ref={leadFormRef}>
              <div className="bg-blue-50 border-2 border-[#0c558c] rounded-lg p-4 w-full" data-testid="lead-capture-form">
                <p className="text-sm font-semibold mb-3 text-slate-900">Great! Let's connect you with our experts</p>
                <form onSubmit={handleLeadFormSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="lead-company" className="text-xs text-slate-700">Company Name</Label>
                    <Input
                      id="lead-company"
                      data-testid="input-lead-company"
                      value={leadFormData.company}
                      onChange={(e) => setLeadFormData({ ...leadFormData, company: e.target.value })}
                      placeholder="ABC Corporation"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-name" className="text-xs text-slate-700">Your Name</Label>
                    <Input
                      id="lead-name"
                      data-testid="input-lead-name"
                      value={leadFormData.contactName}
                      onChange={(e) => setLeadFormData({ ...leadFormData, contactName: e.target.value })}
                      placeholder="John Doe"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-email" className="text-xs text-slate-700">Email</Label>
                    <Input
                      id="lead-email"
                      data-testid="input-lead-email"
                      type="email"
                      value={leadFormData.email}
                      onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                      placeholder="john@company.com"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-phone" className="text-xs text-slate-700">Phone</Label>
                    <Input
                      id="lead-phone"
                      data-testid="input-lead-phone"
                      type="tel"
                      value={leadFormData.phone}
                      onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      required
                      className="mt-1"
                    />
                  </div>
                  <Button
                    data-testid="button-submit-lead"
                    type="submit"
                    className="w-full bg-[#0c558c] hover:bg-[#00a5cb] text-white"
                  >
                    Submit
                  </Button>
                </form>
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
