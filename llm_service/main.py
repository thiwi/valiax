from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from llm import ask_llm
from pydantic import BaseModel
import traceback

class AskRequest(BaseModel):
    prompt: str

app = FastAPI(debug=True)

# enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for development
    allow_methods=["*"],  # allow GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # allow all headers
    allow_credentials=True,
)


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/ask")
async def ask(request: AskRequest):
    try:
        response = ask_llm(request.prompt)
        return {"response": response}
    except Exception as e:
        # Log the full stack trace to aid debugging
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
