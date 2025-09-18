import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileText, Upload, MessageSquare, LogOut, Search, User, Plus, Clock, Download, Eye, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { reprocessStuckDocuments } from "@/utils/reprocessDocuments";
import DeleteDocumentDialog from "@/components/DeleteDocumentDialog";

interface Document {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  processing_status: string;
  created_at: string;
  simplified_summary?: string;
  file_path: string;
}

interface DashboardProps {
  onNavigateToUpload: () => void;
  onNavigateToDocument: (documentId: string) => void;
}

export const Dashboard = ({ onNavigateToUpload, onNavigateToDocument }: DashboardProps) => {
  const { user, signOut } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; document: Document | null }>({
    isOpen: false,
    document: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive",
        });
      } else {
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error", 
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentDocuments = filteredDocuments.slice(0, 6);
  const processingCount = documents.filter(doc => doc.processing_status === 'processing').length;
  const completedCount = documents.filter(doc => doc.processing_status === 'completed').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Simplified';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const handleReprocessDocuments = async () => {
    try {
      toast({
        title: "Processing",
        description: "Reprocessing stuck documents...",
      });
      await reprocessStuckDocuments();
      await fetchDocuments(); // Refresh the documents list
      toast({
        title: "Success",
        description: "Reprocessing completed!",
      });
    } catch (error) {
      console.error('Error reprocessing documents:', error);
      toast({
        title: "Error",
        description: "Failed to reprocess documents",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = (document: Document) => {
    setDeleteDialog({ isOpen: true, document });
  };

  const handleDeleteSuccess = () => {
    fetchDocuments(); // Refresh the documents list
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/src/assets/logo.png" alt="LegalEase AI Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-2xl font-bold text-foreground">LegalEase AI</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.display_name || user?.email}
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your legal documents and view simplification progress
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="legal-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-law-gold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">
                All uploaded documents
              </p>
            </CardContent>
          </Card>

          <Card className="legal-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{processingCount}</div>
              <p className="text-xs text-muted-foreground">
                Currently being simplified
              </p>
            </CardContent>
          </Card>

          <Card className="legal-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <p className="text-xs text-muted-foreground">
                Ready for Q&A chat
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="legal-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with your document simplification workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={onNavigateToUpload} className="legal-gradient flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Document
                </Button>
                <Button variant="outline" className="flex-1" disabled={completedCount === 0}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Q&A Session
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleReprocessDocuments}
                  disabled={processingCount === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reprocess Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Documents</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={onNavigateToUpload} size="sm" className="legal-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Upload New
              </Button>
              {processingCount > 0 && (
                <Button onClick={handleReprocessDocuments} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Processing
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="legal-card animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="legal-card hover:shadow-glow transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 legal-gradient rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{doc.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{doc.original_filename}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${getStatusColor(doc.processing_status)}`}>
                          {getStatusText(doc.processing_status)}
                        </span>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                        <span className="uppercase">{doc.file_type}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => onNavigateToDocument(doc.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {doc.processing_status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onNavigateToDocument(doc.id)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="legal-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 legal-gradient rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Documents Yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Upload your first legal document to get started with AI-powered simplification
                </p>
                <Button onClick={onNavigateToUpload} className="legal-gradient">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Button>
              </CardContent>
            </Card>
          )}

          {filteredDocuments.length > 6 && (
            <div className="text-center mt-6">
              <Button variant="outline">
                View All Documents ({documents.length})
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <DeleteDocumentDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, document: null })}
        document={deleteDialog.document}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};