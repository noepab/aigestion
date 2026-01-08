from typing import Dict, List

import uvicorn
from app.rag import RAGEngine
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="AIGestion NeuroCore", description="Neural Engine for RAG and Deep Learning")

# Initialize RAG Engine
# We use a global variable for the engine to persist across requests
rag_engine = None

@app.on_event("startup")
async def startup_event():
    global rag_engine
    # Use the shared data directory for persistence
    # Assuming running from 'ml-service' root, data is in '../data'
    rag_engine = RAGEngine(persist_directory="../data/chromadb")

class ArchiveRequest(BaseModel):
    content: str
    source: str = "user-input"
    tags: List[str] = []

class SearchRequest(BaseModel):
    query: str
    limit: int = 3

class SearchResponse(BaseModel):
    query: str
    results: List[Dict]

@app.get("/")
def read_root():
    return {"status": "online", "service": "AIGestion NeuroCore (RAG)"}

@app.post("/archive")
async def archive_knowledge(request: ArchiveRequest):
    """
    Memorize information (archive).
    """
    if not request.content:
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    metadata = {
        "source": request.source,
        "tags": ",".join(request.tags)
    }

    chunks_count = rag_engine.archive(request.content, metadata)
    return {"status": "archived", "chunks_added": chunks_count, "size": len(request.content)}

@app.post("/recall")
async def recall_knowledge(request: SearchRequest):
    """
    Retrieve information (recall).
    """
    results = rag_engine.retrieve(request.query, n_results=request.limit)
    return SearchResponse(query=request.query, results=results)

@app.post("/forget")
async def forget_all():
    """
    Wipe memory. DANGEROUS.
    """
    rag_engine.wipe_memory()
    return {"status": "memory_wiped"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
