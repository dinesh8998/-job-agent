import os
import json
import logging
import chromadb

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Initialize ChromaDB persistent client in the backend directory
CHROMA_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_data")
client = chromadb.PersistentClient(path=CHROMA_DATA_DIR)
collection = client.get_or_create_collection(name="resumes")

def store_resume(resume_id: str, text: str, metadata: dict):
    """
    Stores resume text and metadata in ChromaDB.
    Serializes list fields (skills, certifications, preferred_roles) to JSON strings.
    """
    chroma_metadata = {}
    
    # Handle list serialization for ChromaDB compatibility
    for key, value in metadata.items():
        if isinstance(value, list):
            chroma_metadata[key] = json.dumps(value)
        else:
            chroma_metadata[key] = str(value) if value is not None else ""
            
    # Store/Upsert in Chroma
    collection.upsert(
        ids=[resume_id],
        documents=[text],
        metadatas=[chroma_metadata]
    )
    # Print the specific required log
    print("RESUME STORED", flush=True)
    logger.info(f"Resume {resume_id} successfully stored in ChromaDB.")

def retrieve_resume(resume_id: str) -> dict:
    """
    Retrieves resume text and metadata from ChromaDB.
    Deserializes list fields back into list objects.
    """
    try:
        result = collection.get(ids=[resume_id])
        if not result or not result["ids"]:
            return None
            
        # Print the specific required log
        print("MEMORY RETRIEVED", flush=True)
        logger.info(f"Resume {resume_id} successfully retrieved from ChromaDB.")
        
        raw_metadata = result["metadatas"][0]
        deserialized_metadata = {}
        
        # Deserialization of lists
        for key, val in raw_metadata.items():
            if key in ["skills", "certifications", "preferred_roles", "job_titles"]:
                try:
                    deserialized_metadata[key] = json.loads(val)
                except Exception:
                    deserialized_metadata[key] = []
            else:
                deserialized_metadata[key] = val
                
        return {
            "id": result["ids"][0],
            "text": result["documents"][0],
            "metadata": deserialized_metadata
        }
    except Exception as e:
        logger.error(f"Error retrieving resume from ChromaDB: {e}")
        return None
