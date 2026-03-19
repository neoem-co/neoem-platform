# NeoEM — The AI Operating System for Manufacturing

NeoEM is a full-stack platform that connects verified OEM factories with SMEs, featuring AI-powered contract drafting and legal risk analysis.

## 🚀 Quick Start with Docker

The easiest way to run the entire stack (Next.js Frontend + FastAPI Backend) is using Docker Compose.

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your Mac/Windows.

### 2. Configure Environment Variables
Ensure you have the following `.env` files set up:

#### **Frontend (.env)**
Create a `.env` in the **root** folder:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### **AI Backend (ai_service/.env)**
Create a `.env` inside the **`ai_service/`** folder:
```bash
TYPHOON_API_KEY=your_opentyphoon_api_key
IAPP_API_KEY=your_iapp_api_key
# Other settings can be copied from .env.example
```

### 3. Run the Application
From the **root directory**, run:
```bash
docker-compose up --build -d
```
if build already done just run 
```bash
docker-compose up -d
```
to run each service separately run 
```bash
docker-compose up -d frontend
docker-compose up -d ai-service
```
to stop each service separately run 
```bash
docker-compose down frontend
docker-compose down ai-service
```


### 4. Access URLs
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **AI Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Project Structure

- `app/`: Next.js 16 (App Router) pages and layout.
- `components/`: UI components (legal-ai, chat, dashboard).
- `ai_service/`: FastAPI backend (Contract Drafting & Risk Check).
- `Dockerfile.frontend`: Docker configuration for the frontend.
- `Dockerfile.backend`: Docker configuration for the AI backend.

---

## 📋 Useful Commands

### Check logs
```bash
# See all logs
docker-compose logs -f

# See only AI backend logs
docker logs -f neoem-ai-service
```

### Stop the services
```bash
docker-compose down
```

### Update after code changes
```bash
docker-compose up --build -d
```

---

## 🔧 Local Development (Without Docker)

If you prefer to run services individually on your machine:

### Frontend
```bash
pnpm install
pnpm dev
```

### AI Backend
```bash
cd ai_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

