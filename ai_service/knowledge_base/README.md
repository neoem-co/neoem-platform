# Thai Legal Knowledge Base

This directory stores Thai legal documents used for RAG (Retrieval-Augmented Generation) in the Contract Risk Check service.

## How It Works

On first startup, the AI service seeds a vector store (ChromaDB in dev, pgvector in prod) with curated summaries of key Thai laws relevant to OEM contracts. When a contract is analysed, the system searches this knowledge base for relevant legal references.

## Adding Custom Legal Documents

To add additional legal knowledge:

1. Place `.txt` or `.md` files in this directory
2. Each file should contain Thai legal text (one topic per file)
3. Use front-matter or naming convention to indicate the law:
   - `ccc_hire_of_work.txt` — ประมวลกฎหมายแพ่งและพาณิชย์ ว่าด้วยจ้างทำของ
   - `trade_secret_act.txt` — พ.ร.บ.ความลับทางการค้า
   - `fda_cosmetics.txt` — ข้อบังคับ อย. เครื่องสำอาง
4. Run the ingest script: `python scripts/ingest_knowledge.py`

## Currently Seeded Knowledge (Built-in)

The following are embedded in the vector store on startup:

| Topic | Thai Law / Source |
|-------|-------------------|
| Hire of Work | ป.พ.พ. มาตรา 587-607 |
| Sales Contract | ป.พ.พ. มาตรา 453-490 |
| Trade Secrets | พ.ร.บ.ความลับทางการค้า พ.ศ. 2545 |
| Patent / IP | พ.ร.บ.สิทธิบัตร |
| Unfair Contracts | พ.ร.บ.ว่าด้วยข้อสัญญาที่ไม่เป็นธรรม พ.ศ. 2540 |
| FDA Cosmetics | พ.ร.บ.เครื่องสำอาง พ.ศ. 2558 |
| FDA Supplements | พ.ร.บ.อาหาร พ.ศ. 2522 |
| OEM Risk Patterns | แนวปฏิบัติที่ดี / common red flags |

## Production Considerations

- In production, replace ChromaDB with Supabase pgvector for persistence
- Consider adding full-text versions of the relevant Thai legal codes
- Add case law summaries (คำพิพากษาศาลฎีกา) for contract disputes
- Update knowledge base regularly as Thai law evolves
