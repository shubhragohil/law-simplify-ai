import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import LegalHighlighter from "@/components/LegalHighlighter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  AlertTriangle,
  BookOpen,
  Key,
  Lightbulb,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentViewerProps {
  documentId: string;
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const DocumentViewer = ({ documentId, onBack }: DocumentViewerProps) => {
  const { user } = useAuth();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocument();
    fetchChatHistory();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      if (!user?.id) return;
      
        const { data: sessions, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('id, title, created_at')
          .eq('document_id', documentId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

      if (sessionError) throw sessionError;

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        setSessionId(session.id);

        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('chat_session_id', session.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        if (messages) {
          setChatMessages(messages.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            created_at: msg.created_at
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage;
    setNewMessage("");
    setSending(true);

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-document', {
        body: {
          message: messageText,
          documentId,
          sessionId: sessionId || undefined,
          userId: user?.id
        }
      });

      if (error) throw error;

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const aiMessage: Message = {
        id: data.messageId || `ai-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString()
      };

      setChatMessages(prev => {
        const withoutTemp = prev.filter(msg => msg.id !== userMessage.id);
        return [...withoutTemp, 
          { ...userMessage, id: `user-${Date.now()}` }, 
          aiMessage
        ];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setChatMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Document not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <img src="/src/assets/logo.png" alt="LegalEase AI Logo" className="h-8 w-8 rounded-lg" />
              <span className="text-2xl font-bold text-foreground">LegalEase AI</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-5rem)]">
        {/* Document Analysis Panel */}
        <div className="space-y-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="legal-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{document.title}</span>
                </CardTitle>
                <CardDescription>
                  {document.file_type?.toUpperCase()} • {(document.file_size / 1024 / 1024).toFixed(2)} MB
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {document.simplified_summary && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="legal-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LegalHighlighter text={document.simplified_summary} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {document.key_points && document.key_points.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="legal-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>Key Points</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {document.key_points.map((point: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {document.legal_terms && document.legal_terms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="legal-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>Legal Terms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {document.legal_terms.map((term: any, index: number) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <h4 className="font-medium text-sm">{term.term || term}</h4>
                        {term.definition && (
                          <p className="text-xs text-muted-foreground mt-1">{term.definition}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {document.warnings && document.warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="legal-card border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Important Warnings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {document.warnings.map((warning: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{warning}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="flex flex-col">
          <Card className="legal-card flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Chat with AI</span>
              </CardTitle>
              <CardDescription>
                Ask questions about your document and get instant answers
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation about your document</p>
                      <p className="text-sm">Ask questions like "What are my obligations?" or "Explain this contract"</p>
                    </div>
                  )}
                  
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start space-x-3 ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'legal-gradient'
                      }`}>
                        {message.role === 'user' ? 
                          <User className="h-4 w-4" /> : 
                          <Bot className="h-4 w-4 text-white" />
                        }
                      </div>
                      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block rounded-lg px-4 py-2 max-w-[85%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {sending && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="h-8 w-8 rounded-full legal-gradient flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="inline-block rounded-lg px-4 py-2 bg-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <Separator />
              
              <div className="p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask a question about your document..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    className="legal-gradient"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};