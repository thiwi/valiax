FROM python:3.11-slim
WORKDIR /app
ENV PYTHONPATH=/app

# Build-Tools + OpenMP-Laufzeit installieren
RUN apt-get update && \
    apt-get install -y build-essential cmake git ninja-build libgomp1 libstdc++6 libatomic1 libgcc-s1 python3-dev && \
    rm -rf /var/lib/apt/lists/*

# Dependencies kopieren & installieren
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r /app/requirements.txt

# Service-Code + Modelle
COPY . /app
EXPOSE 9000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000", "--log-level", "debug"]