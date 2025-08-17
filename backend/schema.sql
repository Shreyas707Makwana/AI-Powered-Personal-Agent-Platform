-- Database schema for RAG document storage

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document chunks table with embeddings
CREATE TABLE IF NOT EXISTS doc_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding REAL[] NOT NULL, -- Vector of 384 dimensions (all-MiniLM-L6-v2)
    token_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for faster lookups
    CONSTRAINT unique_chunk_per_document UNIQUE(document_id, chunk_index)
);

-- Index for document lookups
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_timestamp ON documents(upload_timestamp);

-- Index for chunk lookups
CREATE INDEX IF NOT EXISTS idx_doc_chunks_document_id ON doc_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding ON doc_chunks USING GIN(embedding);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (optional)
-- INSERT INTO documents (file_name, file_size, status) VALUES 
-- ('sample.pdf', 1024000, 'processed');

-- INSERT INTO doc_chunks (document_id, chunk_text, chunk_index, embedding, token_count) VALUES 
-- (1, 'This is a sample text chunk.', 0, ARRAY[0.1, 0.2, 0.3, ...], 8);
