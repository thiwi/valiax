# Use a minimal Python base image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /scripts

# Copy the Python script into the container
COPY list_due_rules.py /scripts/list_due_rules.py

# Install required Python packages
RUN pip install --no-cache-dir sqlalchemy psycopg2-binary

# Define the entrypoint to run the script
ENTRYPOINT ["python", "/scripts/list_due_rules.py"]
