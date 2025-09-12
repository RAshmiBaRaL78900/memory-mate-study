import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUploadProps {
  conversationId: string;
  onDocumentUploaded?: (document: any) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  conversationId, 
  onDocumentUploaded 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/markdown',
        'application/json'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Unsupported file type",
          description: "Please select a PDF, Word document, or text file",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const extractTextContent = async (file: File): Promise<string> => {
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      return await file.text();
    }
    
    if (file.type === 'application/json') {
      const jsonContent = await file.text();
      return `JSON Content:\n${JSON.stringify(JSON.parse(jsonContent), null, 2)}`;
    }

    // For PDF and Word documents, we'll need to implement server-side processing
    // For now, return a placeholder
    return `Document uploaded: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\n\nNote: Text extraction for this file type is being processed...`;
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Extract text content
      const textContent = await extractTextContent(file);

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `documents/${conversationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file');
      }

      // Save document metadata to database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          conversation_id: conversationId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          content_text: textContent,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save document metadata');
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      if (onDocumentUploaded) {
        onDocumentUploaded(document);
      }

      // Reset form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="document-upload" className="text-sm font-medium">
            Upload Document for Analysis
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Supported formats: PDF, Word documents, Text files, Markdown, JSON (Max 10MB)
          </p>
        </div>

        {!file ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Click to select a document or drag and drop
              </p>
              <Input
                ref={fileInputRef}
                id="document-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md,.json"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB • {file.type}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};