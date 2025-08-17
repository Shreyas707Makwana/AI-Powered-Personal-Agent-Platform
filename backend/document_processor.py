import fitz  # PyMuPDF
import os
import tempfile
from typing import List, Tuple
from sentence_transformers import SentenceTransformer
import numpy as np
import re

class DocumentProcessor:
    def __init__(self):
        """Initialize the document processor with embedding model"""
        self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.chunk_size = 500  # Target token count per chunk
        
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file using PyMuPDF"""
        try:
            doc = fitz.open(file_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', '', text)
        # Strip leading/trailing whitespace
        text = text.strip()
        return text
    
    def split_into_chunks(self, text: str) -> List[str]:
        """Split text into chunks of approximately 500 tokens"""
        # Simple sentence-based splitting (in production, use proper tokenization)
        sentences = re.split(r'[.!?]+', text)
        chunks = []
        current_chunk = ""
        current_length = 0
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Rough token estimation (words + punctuation)
            sentence_length = len(sentence.split()) + len(re.findall(r'[^\w\s]', sentence))
            
            if current_length + sentence_length > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
                current_length = sentence_length
            else:
                current_chunk += " " + sentence if current_chunk else sentence
                current_length += sentence_length
        
        # Add the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        try:
            embeddings = self.embedding_model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            raise Exception(f"Error generating embeddings: {str(e)}")
    
    def process_document(self, file_path: str) -> Tuple[List[str], List[List[float]]]:
        """Process a document: extract text, chunk it, and generate embeddings"""
        # Extract text
        text = self.extract_text_from_pdf(file_path)
        
        # Clean text
        cleaned_text = self.clean_text(text)
        
        # Split into chunks
        chunks = self.split_into_chunks(cleaned_text)
        
        # Generate embeddings
        embeddings = self.generate_embeddings(chunks)
        
        return chunks, embeddings
    
    def estimate_token_count(self, text: str) -> int:
        """Estimate token count for a text (rough approximation)"""
        # Simple word-based estimation
        words = text.split()
        punctuation = len(re.findall(r'[^\w\s]', text))
        return len(words) + punctuation

def save_uploaded_file(upload_file, temp_dir: str = None) -> str:
    """Save uploaded file to temporary directory and return file path"""
    if temp_dir is None:
        import tempfile
        temp_dir = tempfile.gettempdir()
    
    try:
        # Create temp file with original extension
        file_extension = os.path.splitext(upload_file.filename)[1]
        temp_file = tempfile.NamedTemporaryFile(
            delete=False, 
            suffix=file_extension, 
            dir=temp_dir
        )
        
        # Write uploaded content to temp file
        content = upload_file.file.read()
        temp_file.write(content)
        temp_file.close()
        
        return temp_file.name
    except Exception as e:
        raise Exception(f"Error saving uploaded file: {str(e)}")
    finally:
        upload_file.file.close()
