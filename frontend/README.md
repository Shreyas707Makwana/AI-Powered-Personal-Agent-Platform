# AI-Powered Personal Agent Platform - Frontend

A modern, responsive frontend for the AI Agent Platform built with Next.js 14, TypeScript, and Tailwind CSS. This frontend provides an intuitive interface for uploading documents, managing your document library, and chatting with AI using RAG (Retrieval-Augmented Generation) capabilities.

## 🚀 Features

- **Document Management**: Upload PDF documents with drag-and-drop support
- **RAG-Enabled Chat**: Chat with AI that understands your uploaded documents
- **Document Selection**: Choose specific documents for targeted RAG queries
- **Citation Tracking**: See source documents and similarity scores for AI responses
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Real-time Updates**: Automatic refresh of document lists and chat history

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks
- **API Integration**: Fetch API with error handling

## 📦 Installation

### 1. Navigate to the frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the frontend directory:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Important**: Make sure your backend server is running on the specified URL.

### 4. Start the development server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL | `http://localhost:8000` |

### Backend Requirements

Ensure your backend server is running and has the following endpoints available:
- `GET /api/ingest/documents` - List uploaded documents
- `POST /api/ingest/upload` - Upload PDF documents
- `POST /api/llm/chat` - Chat with AI (with RAG support)

## 🎯 Usage

### 1. Upload Documents
1. **Drag and drop** a PDF file onto the upload area, or **click to browse**
2. Click **"Upload Document"** to process the file
3. Wait for the upload to complete - you'll see a success message
4. The document will appear in your documents list

### 2. Chat with AI
1. **Enable RAG** by checking the "Use RAG" checkbox
2. **Adjust Top K** to control how many document chunks to retrieve (1-10)
3. **Select a document** (optional) to focus RAG queries on specific content
4. **Type your question** in the chat input
5. **Press Enter** or click **Send** to get an AI response

### 3. View Citations
When RAG is enabled, AI responses include:
- **Source snippets** from relevant document chunks
- **Similarity scores** showing how relevant each chunk is
- **Document links** to view the source content

## 🧪 Testing

### Manual Test Flow

1. **Start Backend Server**
   ```bash
   cd backend
   python main.py
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Document Upload**
   - Navigate to `http://localhost:3000`
   - Upload `sample.pdf` (or any PDF)
   - Verify success message and document appears in list

4. **Test RAG Chat**
   - Enable "Use RAG" checkbox
   - Ask: "What is this document about?"
   - Verify response includes citations from your document

5. **Test Document Selection**
   - Click on a document in the sidebar
   - Verify it's highlighted in blue
   - Send a RAG query - it should focus on the selected document

### Expected Results

- ✅ **Upload**: Success message with chunk count
- ✅ **Documents List**: Shows uploaded files with status
- ✅ **RAG Chat**: Responses include document context and citations
- ✅ **Document Selection**: Visual feedback and focused queries
- ✅ **Responsive Design**: Works on mobile and desktop

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main page layout
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── Chat.tsx          # Chat interface with RAG
│   │   ├── Upload.tsx        # Document upload component
│   │   └── DocumentsList.tsx # Document management
│   └── lib/
│       └── api.ts            # API integration functions
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## 🔍 Component Details

### Chat Component
- **RAG Controls**: Toggle RAG, adjust Top K, select documents
- **Message History**: Scrollable chat with user/assistant messages
- **Citation Display**: Source snippets with similarity scores
- **Auto-scroll**: Automatically scrolls to new messages

### Upload Component
- **Drag & Drop**: Intuitive file upload interface
- **File Validation**: Only accepts PDF files
- **Progress Feedback**: Loading states and success/error messages
- **File Preview**: Shows selected file details before upload

### DocumentsList Component
- **Document Display**: File names, sizes, upload dates, and status
- **Selection State**: Visual feedback for selected documents
- **Refresh Control**: Manual refresh button for document list
- **Status Indicators**: Color-coded processing status

## 🚨 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Verify backend server is running on `http://localhost:8000`
   - Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
   - Ensure backend has CORS enabled for frontend origin

2. **Upload Fails**
   - Check file size (max 10MB)
   - Ensure file is PDF format
   - Verify backend `/api/ingest/upload` endpoint is working

3. **RAG Chat Not Working**
   - Ensure "Use RAG" checkbox is checked
   - Verify documents are uploaded and processed
   - Check backend RAG endpoints are functional

4. **TypeScript Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check for syntax errors in component files
   - Verify TypeScript configuration in `tsconfig.json`

### Debug Commands

```bash
# Check for TypeScript errors
npm run lint

# Build the project
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables for Production
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

## 📚 API Reference

### Frontend API Functions

- `fetchDocuments()`: Get list of uploaded documents
- `uploadDocument(file)`: Upload a PDF file
- `sendChat(messages, options)`: Send chat message with RAG options

### RAG Options
- `use_rag`: Enable/disable RAG functionality
- `top_k`: Number of document chunks to retrieve
- `document_id`: Focus on specific document (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the AI-Powered Personal Agent Platform.

---

**Happy coding! 🎉**

For backend setup and API documentation, see the `backend/` directory.
