import time
from fastapi import APIRouter, HTTPException

from schemas.requests import IndexTripRequest, ReindexAllRequest, ChatRequest
from services.rag_service import rag_service

router = APIRouter(tags=["RAG Chatbot"])

@router.post("/index-trip")
def index_trip(data: IndexTripRequest):
    try:
        summary_text = data.summary_text.strip()
        trip_name = data.trip_name or f"Trip {data.trip_id}"

        if not summary_text:
            raise HTTPException(status_code=400, detail="Missing 'summary_text'")

        doc_id = f"trip_{data.trip_id}"
        embedding = rag_service.embed(summary_text)

        rag_service.upsert_documents(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[summary_text],
            metadatas=[{
                "trip_id": str(data.trip_id),
                "trip_name": trip_name,
                "indexed_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }],
        )

        return {
            "status": "success",
            "message": f"Trip {data.trip_id} indexed successfully",
            "doc_id": doc_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[/index-trip Error] {e!s}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reindex-all")
def reindex_all(data: ReindexAllRequest):
    try:
        trips = data.trips
        if not trips:
            return {"status": "success", "message": "No trips to index", "count": 0}

        ids, embeddings, documents, metadatas = [], [], [], []

        for trip in trips:
            summary_text = trip.summary_text.strip()
            trip_name = trip.trip_name or f"Trip {trip.trip_id}"
            if not summary_text: continue

            ids.append(f"trip_{trip.trip_id}")
            embeddings.append(rag_service.embed(summary_text))
            documents.append(summary_text)
            metadatas.append({
                "trip_id": str(trip.trip_id),
                "trip_name": trip_name,
                "indexed_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            })

        rag_service.upsert_documents(ids, embeddings, documents, metadatas)

        return {
            "status": "success",
            "message": f"{len(ids)} trips indexed",
            "count": len(ids),
        }

    except Exception as e:
        print(f"[/reindex-all Error] {e!s}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
def chat(data: ChatRequest):
    try:
        query = data.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Missing 'query'")

        total_docs = rag_service.get_collection_count()

        if total_docs == 0:
            return {
                "status": "success",
                "insight": "I don't have any trip data indexed yet. Please create a trip and add some expenses — the data will be automatically available for me to analyze!",
            }

        n_results = min(3, total_docs)
        query_embedding = rag_service.embed(query)

        results = rag_service.query_documents(query_embedding, n_results)

        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]

        if not docs:
            return {
                "status": "success",
                "insight": "I couldn't find relevant trip information for your question. Try asking about a specific trip name or expense category.",
            }

        context_parts = []
        for i, (doc, meta) in enumerate(zip(docs, metas)):
            context_parts.append(
                f"--- Context {i + 1} (Trip: {meta.get('trip_name', 'Unknown')}) ---\n{doc}"
            )
        context_text = "\n\n".join(context_parts)

        insight = rag_service.generate_chat_response(context_text, query)

        return {
            "status": "success",
            "insight": insight,
            "sources": [m.get("trip_name", "Unknown") for m in metas],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[/chat Error] {e!s}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    try:
        doc_count = rag_service.get_collection_count()
        chroma_status = "ready"
    except Exception:
        doc_count = 0
        chroma_status = "error"

    return {
        "status": "healthy",
        "service": "ai-unified",
        "model": "llama-3.1-8b-instant",
        "embedding_model": "all-MiniLM-L6-v2",
        "chroma": chroma_status,
        "indexed_trips": doc_count,
    }
