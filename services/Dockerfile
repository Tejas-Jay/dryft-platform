# Dockerfile for Python Services
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service files
COPY queue_server.py .
COPY matchmaker.py .
COPY simulator.py .

# Make scripts executable
RUN chmod +x queue_server.py matchmaker.py simulator.py

# Default command (will be overridden by docker-compose)
CMD ["python", "queue_server.py"]
