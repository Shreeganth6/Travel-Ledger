import os
from groq import Groq
import chromadb
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

class RAGService:
    def __init__(self):
        # Groq Client
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        # ChromaDB setup
        chroma_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma_client.get_or_create_collection(
            name="trip_summaries",
            metadata={"hnsw:space": "cosine"},
        )

        # Embedding model
        print("[RAG Service] Loading embedding model (all-MiniLM-L6-v2)...")
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[RAG Service] Embedding model loaded successfully")

        # System prompt
        self.system_prompt = """
You are an expert AI Financial Analyst for a mobile travel expense tracker app.
You answer questions about trips, expenses, budgets, and who owes whom.

STRICT RULES:
1. Base your answer ONLY on the trip summary documents provided in the context below.
2. Never invent, assume, or hallucinate any names, amounts, or places not in the context.
3. Be conversational, concise, and friendly. Aim for 3-5 sentences.
4. If the user asks about something not covered in the context, say "I don't have that information in the indexed trips."
5. Use INR (₹) as the currency unless the data says otherwise.
6. If asked to compare trips, use data from the multiple summaries provided.
"""

    def embed(self, text: str) -> list[float]:
        return self.embedding_model.encode(text).tolist()

    def get_collection_count(self) -> int:
        return self.collection.count()

    def upsert_documents(self, ids: list[str], embeddings: list[list[float]], documents: list[str], metadatas: list[dict]):
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

    def query_documents(self, query_embedding: list[float], n_results: int):
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
        )

    def generate_chat_response(self, context_text: str, query: str) -> str:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {
                "role": "user",
                "content": (
                    f"RETRIEVED TRIP CONTEXT:\n{context_text}\n\n"
                    f"USER QUESTION: {query}"
                ),
            },
        ]

        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.3,
            max_tokens=400,
        )
        return response.choices[0].message.content

rag_service = RAGService()
