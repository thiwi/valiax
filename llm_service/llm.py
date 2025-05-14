# llm_service/llm.py
import os
from ctransformers import AutoModelForCausalLM

# Basisverzeichnis ist /app im Container
base_dir = os.path.dirname(__file__)
# Modell liegt jetzt in llm_service/models/mistral3b.gguf
model_path = os.path.join(base_dir, "models", "mistral3b.gguf")

# Lade das GGUF-Modell lokal
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    model_type="llama",
    local_files_only=True
)

def ask_llm(prompt: str) -> str:
    # Call the model directly to get the complete response
    return model(prompt)