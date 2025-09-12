import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LandingPage } from "@/components/LandingPage";
import { Auth } from "./Auth";
import { Dashboard } from "./Dashboard";
import { DocumentUpload } from "./DocumentUpload";

type AppState = 'landing' | 'auth' | 'dashboard' | 'upload' | 'document';

const Index = () => {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (user) {
        setAppState('dashboard');
      } else {
        setAppState('landing');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 legal-gradient rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  switch (appState) {
    case 'landing':
      return <LandingPage onGetStarted={() => setAppState('auth')} />;
    case 'auth':
      return <Auth />;
    case 'dashboard':
      return (
        <Dashboard
          onNavigateToUpload={() => setAppState('upload')}
          onNavigateToDocument={(id) => {
            setSelectedDocumentId(id);
            setAppState('document');
          }}
        />
      );
    case 'upload':
      return (
        <DocumentUpload
          onBack={() => setAppState('dashboard')}
          onDocumentUploaded={(id) => {
            setSelectedDocumentId(id);
            setAppState('document');
          }}
        />
      );
    default:
      return <LandingPage onGetStarted={() => setAppState('auth')} />;
  }
};

export default Index;
