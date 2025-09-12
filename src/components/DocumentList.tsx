import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Trash2 } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onAskQuestion: (documentId: string, documentName: string) => void;
  onDeleteDocument: (documentId: string) => void;
  loading?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onAskQuestion,
  onDeleteDocument,
  loading = false,
}) => {
  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Uploaded Documents
        </h3>
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{document.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAskQuestion(document.id, document.file_name)}
                className="h-8 px-2"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Ask
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteDocument(document.id)}
                className="h-8 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};