import type { Metadata } from "next";
import { Factory, FileText, ShieldCheck } from "lucide-react";
import { OemCategoryLandingPage, type OemCategoryLandingCopy } from "@/components/seo/OemCategoryLandingPage";
import { getFactories, getFactoryCategoryId, isThaiLocale } from "@/lib/factory-data";
import { createPageMetadata } from "@/lib/seo";

function getCopy(locale: string): OemCategoryLandingCopy {
  if (isThaiLocale(locale)) {
    return {
      badge: "โรงงาน OEM อาหารเสริม",
      title: "หาโรงงาน OEM อาหารเสริมในไทย",
      description:
        "รวมแนวทางและรายชื่อโรงงาน OEM อาหารเสริมในไทยสำหรับแบรนด์ที่ต้องการเปรียบเทียบผู้ผลิต MOQ และความพร้อมก่อนเริ่มพัฒนาสินค้าและผลิตจริง",
      intro:
        "ถ้าคุณกำลังจะสร้างแบรนด์อาหารเสริมหรือวิตามิน หน้านี้ช่วยให้คุณเริ่มจากโรงงาน OEM อาหารเสริมที่ตรงหมวดสินค้า พร้อมดูข้อมูลที่ควรเปรียบเทียบก่อนเริ่มคุยงาน",
      highlights: [
        {
          title: "เริ่มจากโรงงานอาหารเสริมที่ตรงหมวด",
          description: "เลือกโรงงานที่มีประสบการณ์กับอาหารเสริมหรือผลิตภัณฑ์สุขภาพที่ใกล้เคียงกับแบรนด์ของคุณ",
          icon: ShieldCheck,
        },
        {
          title: "เปรียบเทียบ MOQ และความพร้อม",
          description: "ดูขั้นต่ำการผลิตและความเหมาะสมของโรงงานกับขนาดการเปิดตัวหรือแผนการเติบโต",
          icon: Factory,
        },
        {
          title: "เดินหน้าต่อได้ง่ายขึ้น",
          description: "ใช้ NEOEM ต่อไปยังการคุยรายละเอียด เอกสาร และเวิร์กโฟลว์ด้านกฎหมายหรือคอมพลายแอนซ์",
          icon: FileText,
        },
      ],
      sectionTitle: "วิธีเลือกโรงงาน OEM อาหารเสริม",
      sectionDescription:
        "โรงงานที่เหมาะควรตรงกับประเภทสินค้า มี MOQ สมเหตุสมผล และมีรายละเอียดเพียงพอให้คุณประเมินความน่าเชื่อถือก่อนเริ่มงานจริง",
      checklistTitle: "โรงงานอาหารเสริมที่คุณสามารถเริ่มดูได้บน NEOEM",
      checklist: [
        "ตรวจสอบว่าโรงงานมีความเชี่ยวชาญด้านอาหารเสริม วิตามิน หรือหมวดสุขภาพที่เกี่ยวข้องกับสินค้า",
        "เปรียบเทียบ MOQ และความพร้อมในการเริ่มผลิตล็อตแรกตามงบประมาณของแบรนด์",
        "ดูข้อมูลสำคัญ เช่น ใบรับรอง ความน่าเชื่อถือ และตำแหน่งของโรงงาน",
        "เตรียมคอนเซปต์สินค้า กลุ่มเป้าหมาย และช่วงราคาที่ต้องการก่อนเริ่มพูดคุยกับโรงงาน",
      ],
      faqTitle: "คำถามที่พบบ่อยเกี่ยวกับโรงงาน OEM อาหารเสริม",
      faqs: [
        {
          question: "เลือกโรงงาน OEM อาหารเสริมอย่างไร?",
          answer:
            "ควรดูความเชี่ยวชาญในหมวดอาหารเสริม MOQ ความชัดเจนในการสื่อสาร และข้อมูลความน่าเชื่อถือของโรงงานก่อนเริ่มงาน",
        },
        {
          question: "ก่อนคุยกับโรงงานอาหารเสริมต้องเตรียมอะไร?",
          answer:
            "ควรเตรียมประเภทสินค้า กลุ่มเป้าหมาย จุดขายหลัก งบประมาณ และช่วง MOQ ที่คาดหวังเพื่อให้ประเมินโรงงานได้เร็วขึ้น",
        },
        {
          question: "ทำไม NEOEM เหมาะกับการหาโรงงานอาหารเสริม?",
          answer:
            "NEOEM ช่วยให้คุณเริ่มจากโรงงานที่ผ่านการตรวจสอบและต่อยอดไปยังขั้นตอนใบเสนอราคา เอกสาร และเครื่องมือประกอบการตัดสินใจได้ง่ายขึ้น",
        },
      ],
      ctaTitle: "เริ่มหาโรงงาน OEM อาหารเสริมของคุณ",
      ctaDescription:
        "ดูรายชื่อโรงงานทั้งหมด หรือกลับไปหน้าคู่มือหลักเพื่อเปรียบเทียบหมวดโรงงาน OEM อื่น ๆ",
      ctaPrimary: "ดูรายชื่อโรงงานทั้งหมด",
      ctaSecondary: "กลับไปคู่มือหาโรงงาน OEM",
    };
  }

  return {
    badge: "Supplement OEM factories",
    title: "Find Supplement OEM Factories in Thailand",
    description:
      "Explore supplement OEM factories in Thailand and compare manufacturer fit, MOQ, and trust signals before launching your health brand.",
    intro:
      "If you are starting a supplement or vitamin brand, this page helps you begin with OEM factories that are relevant to the category and easier to compare.",
    highlights: [
      {
        title: "Start with category-fit supplement factories",
        description: "Focus on manufacturers experienced in supplements or adjacent health-product categories.",
        icon: ShieldCheck,
      },
      {
        title: "Compare MOQ and launch readiness",
        description: "See whether a factory matches your expected first run, budget, and growth plan.",
        icon: Factory,
      },
      {
        title: "Move into workflows faster",
        description: "Continue from sourcing into documents, negotiation, and legal/compliance support inside NEOEM.",
        icon: FileText,
      },
    ],
    sectionTitle: "How to choose a supplement OEM factory",
    sectionDescription:
      "The right factory should fit your category, MOQ expectations, and communication needs while giving you enough information to assess credibility.",
    checklistTitle: "Supplement factories to explore on NEOEM",
    checklist: [
      "Check for experience in supplements, vitamins, or adjacent wellness-product categories",
      "Compare MOQ and production readiness against your launch budget",
      "Review key trust signals, certifications, and factory details before outreach",
      "Prepare your product concept, positioning, and MOQ range before contacting manufacturers",
    ],
    faqTitle: "Common questions about supplement OEM factories",
    faqs: [
      {
        question: "How do I choose a supplement OEM factory?",
        answer:
          "Compare supplement-category fit, MOQ, trust signals, and communication quality before moving into production planning.",
      },
      {
        question: "What should I prepare before contacting a supplement factory?",
        answer:
          "Prepare your product type, target audience, key selling points, budget range, and expected MOQ for the first run.",
      },
      {
        question: "Why use NEOEM for supplement factory sourcing?",
        answer:
          "NEOEM helps brands begin with verified factory discovery and continue into quotation, document, and legal/compliance workflows more smoothly.",
      },
    ],
    ctaTitle: "Start sourcing a supplement OEM factory",
    ctaDescription:
      "Browse all factories or return to the main OEM guide to compare more manufacturing categories.",
    ctaPrimary: "Browse all factories",
    ctaSecondary: "Back to the OEM guide",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getCopy(locale);

  return createPageMetadata({
    locale,
    pathname: "oem-supplement-factory",
    title: copy.title,
    description: copy.description,
    keywords: isThaiLocale(locale)
      ? [
          "โรงงาน OEM อาหารเสริม",
          "หาโรงงาน OEM อาหารเสริม",
          "โรงงานอาหารเสริม",
          "โรงงานผลิตอาหารเสริม",
          "NEOEM",
        ]
      : [
          "supplement OEM factory Thailand",
          "find supplement manufacturer Thailand",
          "vitamin manufacturer Thailand",
          "health product OEM Thailand",
          "NEOEM",
        ],
  });
}

export default async function OemSupplementFactoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = getCopy(locale);
  const factories = getFactories(locale)
    .filter((factory) => getFactoryCategoryId(factory) === "supplements")
    .slice(0, 4);

  return (
    <OemCategoryLandingPage
      locale={locale}
      pathname="oem-supplement-factory"
      copy={copy}
      factories={factories}
    />
  );
}
