#!/bin/bash

echo "Starting Local AI Persona Builder..."

if ! command -v ollama &> /dev/null
then
  echo "Ollama is not installed."
  echo "Install it from https://ollama.com or run: brew install ollama"
  exit 1
fi

echo "Checking Ollama service..."
if ! curl -s http://localhost:11434/api/tags > /dev/null
then
  echo "Starting Ollama..."
  ollama serve &
  sleep 3
fi

echo "Checking model qwen2.5:3b..."
if ! ollama list | grep -q "qwen2.5:3b"
then
  echo "Pulling qwen2.5:3b..."
  ollama pull qwen2.5:3b
fi

echo "Starting backend..."
cd backend

if [ ! -d "node_modules" ]; then
  npm install
fi

MODEL_NAME=qwen2.5:3b PORT=3001 npm start