"""Minimal wrapper around a locally stored language model."""

import os
from ctransformers import AutoModelForCausalLM

# Determine the absolute path to the bundled GGUF model file. The container
# mounts ``/app`` as the working directory, so ``__file__`` points inside that
# directory.
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "models", "mistral3b.gguf")

# Load the GGUF model once at import time so subsequent calls are fast. Setting
# ``local_files_only=True`` avoids any attempt to download the model.
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    model_type="llama",
    local_files_only=True,
)


def ask_llm(prompt: str) -> str:
    """Return the model's response for ``prompt``."""

    # Invoke the model directly to produce the completion text
    return model(prompt)