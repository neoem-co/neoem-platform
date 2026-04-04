import type { Metadata } from "next";
import { Factory, FileText, ShieldCheck } from "lucide-react";
import { OemCategoryLandingPage, type OemCategoryLandingCopy } from "@/components/seo/OemCategoryLandingPage";
import { getFactories, getFactoryCategoryId, isThaiLocale } from "@/lib/factory-data";
import { createPageMetadata } from "@/lib/seo";

function getCopy(locale: string): OemCategoryLandingCopy {
  if (isThaiLocale(locale)) {
    return {
      badge: "โรงงาน OEM เครื่องสำอาง",
      title: "หาโรงงาน OEM เครื่องสำอางในไทย",
      description:
        "รวมแนวทางและรายชื่อโรงงาน OEM เครื่องสำอางที่ผ่านการตรวจสอบในไทย เหมาะสำหรับแบรนด์ใหม่และผู้ประกอบการที่ต้องการเปรียบเทียบ MOQ ความเชี่ยวชาญ และความน่าเชื่อถือก่อนเริ่มผลิต",
      intro:
        "ถ้าคุณต้องการหาโรงงาน OEM เครื่องสำอางสำหรับสกินแคร์ เมคอัพ หรือผลิตภัณฑ์ดูแลผิวในไทย หน้านี้ช่วยให้คุณเริ่มจากโรงงานที่ตรงหมวดสินค้าและดูข้อมูลสำคัญก่อนเริ่มคุยงาน",
      highlights: [
        {
          title: "คัดโรงงานเครื่องสำอางที่ตรงหมวด",
          description: "ดูโรงงานที่มีประสบการณ์ในเครื่องสำอาง สกินแคร์ และการพัฒนาสูตรสำหรับแบรนด์",
          icon: ShieldCheck,
        },
        {
          title: "เทียบ MOQ และความพร้อมในการผลิต",
          description: "เปรียบเทียบขั้นต่ำการผลิต ความเชี่ยวชาญ และความเหมาะสมกับขนาดแบรนด์ของคุณ",
          icon: Factory,
        },
        {
          title: "ต่อยอดสู่สัญญาและคอมพลายแอนซ์",
          description: "ใช้ NEOEM ต่อไปยังการเจรจา สัญญา และงานเอกสารที่เกี่ยวข้องกับการผลิตเครื่องสำอาง",
          icon: FileText,
        },
      ],
      sectionTitle: "วิธีเลือกโรงงาน OEM เครื่องสำอาง",
      sectionDescription:
        "โรงงานที่ดีควรตรงกับประเภทสินค้า มี MOQ ที่เหมาะสม สื่อสารชัดเจน และมีความน่าเชื่อถือเพียงพอสำหรับการทำแบรนด์ระยะยาว",
      checklistTitle: "โรงงานเครื่องสำอางที่น่าสนใจบน NEOEM",
      checklist: [
        "ตรวจสอบว่าโรงงานมีประสบการณ์กับเครื่องสำอางหรือสกินแคร์ประเภทเดียวกับที่คุณต้องการผลิต",
        "เปรียบเทียบ MOQ กับงบประมาณและขนาดการเปิดตัวสินค้ารอบแรก",
        "ดูใบรับรอง มาตรฐานการผลิต และสัญญาณความน่าเชื่อถือก่อนเริ่มคุยงาน",
        "เตรียมรายละเอียดสินค้า เช่น สูตร บรรจุภัณฑ์ และตำแหน่งทางการตลาด เพื่อคุยกับโรงงานได้ชัดเจนขึ้น",
      ],
      faqTitle: "คำถามที่พบบ่อยเกี่ยวกับโรงงาน OEM เครื่องสำอาง",
      faqs: [
        {
          question: "เลือกโรงงาน OEM เครื่องสำอางอย่างไรให้เหมาะกับแบรนด์ใหม่?",
          answer:
            "เริ่มจากโรงงานที่มี MOQ ไม่สูงเกินไป มีประสบการณ์ในหมวดเครื่องสำอางที่คุณต้องการ และสามารถสื่อสารเรื่องสูตร บรรจุภัณฑ์ และระยะเวลาผลิตได้ชัดเจน",
        },
        {
          question: "ก่อนคุยกับโรงงาน OEM เครื่องสำอางควรเตรียมอะไร?",
          answer:
            "ควรเตรียมประเภทสินค้า กลุ่มเป้าหมาย งบประมาณ ช่วง MOQ ที่ต้องการ และตัวอย่างแบรนด์หรือคอนเซปต์สินค้าที่ใกล้เคียง",
        },
        {
          question: "ทำไมควรใช้ NEOEM เพื่อหาโรงงานเครื่องสำอาง?",
          answer:
            "NEOEM ช่วยให้คุณเปรียบเทียบโปรไฟล์โรงงานที่ผ่านการตรวจสอบ และต่อยอดไปยังเวิร์กโฟลว์ด้านใบเสนอราคา สัญญา และคอมพลายแอนซ์ได้ง่ายขึ้น",
        },
      ],
      ctaTitle: "เริ่มหาโรงงาน OEM เครื่องสำอางของคุณ",
      ctaDescription:
        "เปิดรายชื่อโรงงานทั้งหมดหรือกลับไปดูคู่มือหาโรงงาน OEM เพื่อเปรียบเทียบหมวดอื่นเพิ่มเติม",
      ctaPrimary: "ดูรายชื่อโรงงานทั้งหมด",
      ctaSecondary: "กลับไปคู่มือหาโรงงาน OEM",
    };
  }

  return {
    badge: "Cosmetics OEM factories",
    title: "Find Cosmetics OEM Factories in Thailand",
    description:
      "Explore verified cosmetics OEM factories in Thailand and compare MOQ, manufacturing fit, and trust signals before launching your beauty brand.",
    intro:
      "If you need a cosmetics OEM factory for skincare, beauty, or personal care products, this page helps you start with factory profiles that match the category.",
    highlights: [
      {
        title: "Find category-fit factories",
        description: "Review factories with cosmetics and skincare manufacturing experience before you request a quote.",
        icon: ShieldCheck,
      },
      {
        title: "Compare MOQ and production fit",
        description: "Shortlist manufacturers that align with your launch size and brand requirements.",
        icon: Factory,
      },
      {
        title: "Move into legal and compliance workflows",
        description: "Continue from discovery into negotiation, contracts, and production readiness inside NEOEM.",
        icon: FileText,
      },
    ],
    sectionTitle: "How to choose a cosmetics OEM factory",
    sectionDescription:
      "The right factory should match your product type, MOQ, communication needs, and long-term brand plans.",
    checklistTitle: "Cosmetics factories to explore on NEOEM",
    checklist: [
      "Check whether the factory has experience with your exact cosmetics or skincare category",
      "Compare MOQ against your launch budget and first production run",
      "Review certifications, trust signals, and manufacturing focus before outreach",
      "Prepare clear product, packaging, and market-positioning notes before contacting factories",
    ],
    faqTitle: "Common questions about cosmetics OEM factories",
    faqs: [
      {
        question: "How do I choose the right cosmetics OEM factory?",
        answer:
          "Start with product category fit, MOQ, certifications, and communication quality. A good fit should support your product type and launch plan.",
      },
      {
        question: "What should I prepare before contacting a cosmetics factory?",
        answer:
          "Prepare your product type, target audience, budget range, MOQ expectations, and any reference products or brand direction.",
      },
      {
        question: "Why use NEOEM for cosmetics factory sourcing?",
        answer:
          "NEOEM combines verified factory discovery with trust signals and workflow tools that help brands move from sourcing into contracts and production with more confidence.",
      },
    ],
    ctaTitle: "Start sourcing a cosmetics OEM factory",
    ctaDescription:
      "Browse all factories or return to the broader OEM guide to compare more categories.",
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
    pathname: "oem-cosmetics-factory",
    title: copy.title,
    description: copy.description,
    keywords: isThaiLocale(locale)
      ? [
          "โรงงาน OEM เครื่องสำอาง",
          "หาโรงงาน OEM เครื่องสำอาง",
          "โรงงานเครื่องสำอาง",
          "โรงงานสกินแคร์ OEM",
          "NEOEM",
        ]
      : [
          "cosmetics OEM factory Thailand",
          "find cosmetics manufacturer Thailand",
          "skincare OEM Thailand",
          "beauty manufacturer Thailand",
          "NEOEM",
        ],
  });
}

export default async function OemCosmeticsFactoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = getCopy(locale);
  const factories = getFactories(locale)
    .filter((factory) => {
      const categoryId = getFactoryCategoryId(factory);
      const searchable = `${factory.category} ${factory.specialties.join(" ")}`.toLowerCase();
      return categoryId === "cosmetics" || searchable.includes("skin care") || searchable.includes("skincare");
    })
    .slice(0, 4);

  return (
    <OemCategoryLandingPage
      locale={locale}
      pathname="oem-cosmetics-factory"
      copy={copy}
      factories={factories}
    />
  );
}
