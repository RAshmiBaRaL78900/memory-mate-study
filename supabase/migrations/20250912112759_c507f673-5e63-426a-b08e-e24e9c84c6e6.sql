-- Create documents table for file metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  content_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view documents" 
ON public.documents 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update documents" 
ON public.documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete documents" 
ON public.documents 
FOR DELETE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_documents_conversation_id ON public.documents(conversation_id);
CREATE INDEX idx_documents_created_at ON public.documents(created_at);