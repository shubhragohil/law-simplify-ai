import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X, CheckCircle, AlertCircle, ArrowLeft, File, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  title: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  id?: string;
}

interface DocumentUploadProps {
  onBack: () => void;
  onDocumentUploaded: (documentId: string) => void;
}

export const DocumentUpload = ({ onBack, onDocumentUploaded }: DocumentUploadProps) => {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
      progress: 0,
      status: 'uploading' as const
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Process each file
    newFiles.forEach((fileItem, index) => {
      uploadFile(fileItem, uploadedFiles.length + index);
    });
  }, [uploadedFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const uploadFile = async (fileItem: UploadedFile, index: number) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => {
          const updated = [...prev];
          if (updated[index] && updated[index].progress < 90) {
            updated[index].progress += 10;
          }
          return updated;
        });
      }, 100);

      // Upload file to Supabase Storage
      const fileExt = fileItem.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, fileItem.file);

      if (uploadError) throw uploadError;

      // Complete upload progress
      clearInterval(progressInterval);
      setUploadedFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].progress = 100;
          updated[index].status = 'processing';
        }
        return updated;
      });

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: fileItem.title,
          original_filename: fileItem.file.name,
          file_path: uploadData.path,
          file_type: fileExt || 'unknown',
          file_size: fileItem.file.size,
          processing_status: 'processing'
        })
        .select()
        .single();

      if (docError) throw docError;

      // Update file item with document ID
      setUploadedFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].id = docData.id;
        }
        return updated;
      });

      // Process with AI
      await processWithAI(docData.id, index);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].status = 'error';
          updated[index].progress = 0;
        }
        return updated;
      });
      toast.error(`Failed to upload ${fileItem.file.name}`);
    }
  };

  const processWithAI = async (documentId: string, index: number) => {
    try {
      console.log('Starting AI processing for document:', documentId);
      
      // Call the AI processing edge function
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: { documentId }
      });

      console.log('AI processing response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'AI processing failed');
      }

      setUploadedFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].status = 'completed';
        }
        return updated;
      });

      toast.success('Document processed successfully with AI!');
      
    } catch (error) {
      console.error('AI processing error:', error);
      setUploadedFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].status = 'error';
        }
        return updated;
      });
      toast.error(`Failed to process document with AI: ${error.message}`);
    }
  };

  const updateFileTitle = (index: number, newTitle: string) => {
    setUploadedFiles(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index].title = newTitle;
      }
      return updated;
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing with AI...';
      case 'completed': return 'Ready for review';
      case 'error': return 'Upload failed';
      default: return status;
    }
  };

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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Upload Legal Documents</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your legal documents and let our AI simplify them into plain English. 
            Supports PDF, DOCX, and TXT files up to 10MB.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="legal-card">
            <CardContent className="p-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-16 w-16 legal-gradient rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  {isDragActive ? (
                    <div>
                      <h3 className="text-xl font-semibold text-primary">Drop your files here</h3>
                      <p className="text-muted-foreground">Release to upload your documents</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Drag & drop your files here</h3>
                      <p className="text-muted-foreground mb-4">or click to browse your computer</p>
                      <Button className="legal-gradient">
                        Select Files
                      </Button>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOCX, TXT (Max 10MB each)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="legal-card">
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>
                  Track the progress of your document uploads and AI processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFiles.map((fileItem, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(fileItem.status)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {fileItem.file.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(fileItem.file.size / (1024 * 1024)).toFixed(2)} MB • {getStatusText(fileItem.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {fileItem.status === 'completed' && fileItem.id && (
                          <Button 
                            size="sm" 
                            onClick={() => onDocumentUploaded(fileItem.id!)}
                            className="legal-gradient"
                          >
                            View Summary
                          </Button>
                        )}
                        {fileItem.status !== 'processing' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Title Editor */}
                    <div className="space-y-2 mb-3">
                      <Label htmlFor={`title-${index}`} className="text-xs">Document Title</Label>
                      <Input
                        id={`title-${index}`}
                        value={fileItem.title}
                        onChange={(e) => updateFileTitle(index, e.target.value)}
                        className="h-8 text-sm"
                        disabled={fileItem.status === 'processing'}
                      />
                    </div>

                    {/* Progress Bar */}
                    {(fileItem.status === 'uploading' || fileItem.status === 'processing') && (
                      <Progress value={fileItem.progress} className="h-2" />
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="legal-card">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="h-12 w-12 legal-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your legal documents in PDF, DOCX, or TXT format
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 legal-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                    <Loader2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">2. AI Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI extracts text and creates simplified summaries
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 legal-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Review & Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Review summaries and ask questions about your documents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};