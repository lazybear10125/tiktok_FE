import os
import uvicorn
from fastapi import FastAPI, Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel

app = FastAPI()

MY_SECRET_KEY = os.getenv("MY_API_KEY", "khoa-bi-mat-cua-toi-123456")
api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)

def verify_key(api_key: str = Security(api_key_header)):
    if api_key != MY_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Truy cập bị từ chối! Sai hoặc thiếu API Key."
        )
    return api_key

my_notes = [{"id": 1, "content": "Ghi chú cá nhân"}]

class NoteItem(BaseModel):
    content: str

@app.get("/api/notes")
def get_notes(api_key: str = Security(verify_key)):
    return {"success": True, "data": my_notes}

@app.post("/api/notes")
def add_note(note: NoteItem, api_key: str = Security(verify_key)):
    new_data = {"id": len(my_notes) + 1, "content": note.content}
    my_notes.append(new_data)
    return {"success": True, "data": new_data}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
