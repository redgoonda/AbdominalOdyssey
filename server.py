"""
Abdominal Odyssey — FastAPI server
Serves the game and provides CRUD API for Q&A management.
Run: python server.py  (or: uvicorn server:app --reload --port 8400)
"""
import json
import os
import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="Abdominal Odyssey API")

BASE_DIR = Path(__file__).parent
QUESTIONS_FILE = BASE_DIR / "questions.json"

# ── Static files ──────────────────────────────────────────────────────────────
app.mount("/js", StaticFiles(directory=BASE_DIR / "js"), name="js")

# ── HTML routes ───────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def serve_game():
    return (BASE_DIR / "index.html").read_text()

@app.get("/admin", response_class=HTMLResponse)
async def serve_admin():
    return (BASE_DIR / "admin.html").read_text()

# ── Questions API ─────────────────────────────────────────────────────────────
def load_questions():
    return json.loads(QUESTIONS_FILE.read_text())

def save_questions(data):
    QUESTIONS_FILE.write_text(json.dumps(data, indent=2))

@app.get("/api/questions")
async def get_questions():
    return load_questions()

class QuestionPayload(BaseModel):
    question: str
    options: List[str]
    correct: int
    explanation: Optional[str] = ""

@app.post("/api/questions/{attending_id}")
async def add_question(attending_id: str, payload: QuestionPayload):
    data = load_questions()
    if attending_id not in data["attendings"]:
        raise HTTPException(status_code=404, detail=f"Attending '{attending_id}' not found")
    new_q = {
        "id": f"{attending_id[0]}{uuid.uuid4().hex[:4]}",
        "question": payload.question,
        "options": payload.options,
        "correct": payload.correct,
        "explanation": payload.explanation
    }
    data["attendings"][attending_id]["questions"].append(new_q)
    save_questions(data)
    return {"status": "ok", "question": new_q}

class CatchphrasePayload(BaseModel):
    catchphrase_correct: Optional[str] = None
    catchphrase_wrong: Optional[str] = None

@app.put("/api/questions/{attending_id}/catchphrases")
async def update_catchphrases(attending_id: str, payload: CatchphrasePayload):
    data = load_questions()
    if attending_id not in data["attendings"]:
        raise HTTPException(status_code=404, detail=f"Attending '{attending_id}' not found")
    attending = data["attendings"][attending_id]
    if payload.catchphrase_correct is not None:
        attending["catchphrase_correct"] = payload.catchphrase_correct
    if payload.catchphrase_wrong is not None:
        attending["catchphrase_wrong"] = payload.catchphrase_wrong
    save_questions(data)
    return {"status": "ok"}

class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    options: Optional[List[str]] = None
    correct: Optional[int] = None
    explanation: Optional[str] = None

@app.put("/api/questions/{attending_id}/{question_id}")
async def update_question(attending_id: str, question_id: str, payload: QuestionUpdate):
    data = load_questions()
    if attending_id not in data["attendings"]:
        raise HTTPException(status_code=404, detail=f"Attending '{attending_id}' not found")
    qs = data["attendings"][attending_id]["questions"]
    q = next((x for x in qs if x["id"] == question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found")
    if payload.question is not None:
        q["question"] = payload.question
    if payload.options is not None:
        q["options"] = payload.options
    if payload.correct is not None:
        q["correct"] = payload.correct
    if payload.explanation is not None:
        q["explanation"] = payload.explanation
    save_questions(data)
    return {"status": "ok", "question": q}

@app.delete("/api/questions/{attending_id}/{question_id}")
async def delete_question(attending_id: str, question_id: str):
    data = load_questions()
    if attending_id not in data["attendings"]:
        raise HTTPException(status_code=404, detail=f"Attending '{attending_id}' not found")
    qs = data["attendings"][attending_id]["questions"]
    original_len = len(qs)
    data["attendings"][attending_id]["questions"] = [q for q in qs if q["id"] != question_id]
    if len(data["attendings"][attending_id]["questions"]) == original_len:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found")
    save_questions(data)
    return {"status": "deleted"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8400))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
