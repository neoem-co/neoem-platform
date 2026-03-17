import sys
import os

# Add the ai_service directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai_service"))

from main import app
