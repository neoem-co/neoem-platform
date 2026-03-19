import type { Metadata } from "next";
import { Factory, FileText, ShieldCheck } from "lucide-react";
import { OemCategoryLandingPage, type OemCategoryLandingCopy } from "@/components/seo/OemCategoryLandingPage";
import { getFactories, getFactoryCategoryId, isThaiLocale } from "@/lib/factory-data";
import { createPageMetadata } from "@/lib/seo";

function getCopy(locale: string): OemCategoryLandingCopy {
  if (isThaiLocale(locale)) {
    return {
      badge: "โรงงาน OEM สกินแคร์",
      title: "หาโรงงาน OEM สกินแคร์ในไทย",
      description:
        "รวมแนวทางและรายชื่อโรงงาน OEM สกินแคร์ในไทยสำหรับแบรนด์ที่ต้องการเปรียบเทียบโรงงาน ดู MOQ ความเชี่ยวชาญด้านดูแลผิว และเริ่มต้นผลิตกับพาร์ทเนอร์ที่เหมาะสม",
      intro:
        "ถ้าคุณกำลังสร้างแบรนด์สกินแคร์ เช่น เซรั่ม ครีม หรือผลิตภัณฑ์ดูแลผิวอื่น ๆ หน้านี้ช่วยให้คุณเริ่มจากโรงงานที่มีความใกล้เคียงกับหมวดสินค้าและดูข้อมูลที่ใช้คัดเลือกได้ง่ายขึ้น",
      highlights: [
        {
          title: "เริ่มจากโรงงานที่เข้าใจสกินแคร์",
          description: "คัดเลือกโรงงานที่มีหมวดสินค้าและประสบการณ์ใกล้เคียงกับผลิตภัณฑ์ดูแลผิวที่คุณต้องการทำ",
          icon: ShieldCheck,
        },
        {
          title: "เทียบ MOQ กับแผนเปิดตัว",
          description: "ดูขั้นต่ำการผลิตและความพร้อมของโรงงานให้สอดคล้องกับงบประมาณและขนาดล็อตแรก",
          icon: Factory,
        },
        {
          title: "ต่อยอดสู่เวิร์กโฟลว์จริงได้เร็ว",
          description: "ใช้ NEOEM ต่อไปยังการพูดคุย ร่างเอกสาร และขั้นตอนประกอบการตัดสินใจของแบรนด์",
          icon: FileText,
        },
      ],
      sectionTitle: "วิธีเลือกโรงงาน OEM สกินแคร์",
      sectionDescription:
        "โรงงานที่เหมาะกับแบรนด์สกินแคร์ควรตรงกับประเภทผลิตภัณฑ์ มี MOQ ที่ทำได้จริง และให้ข้อมูลที่ชัดเจนพอสำหรับประเมินความน่าเชื่อถือก่อนเริ่มผลิต",
      checklistTitle: "โรงงานสกินแคร์ที่คุณเริ่มดูได้บน NEOEM",
      checklist: [
        "ตรวจสอบว่าโรงงานมีความเชี่ยวชาญกับสินค้าดูแลผิว เช่น เซรั่ม ครีม โลชั่น หรือหมวดใกล้เคียง",
        "เปรียบเทียบ MOQ กับงบประมาณเปิดตัวสินค้าและความเสี่ยงของล็อตแรก",
        "ดูรายละเอียดด้านความน่าเชื่อถือ ใบรับรอง และความพร้อมในการสื่อสารกับแบรนด์ใหม่",
        "เตรียมคอนเซปต์สินค้า จุดขาย และราคาขายที่ต้องการก่อนเริ่มติดต่อโรงงาน",
      ],
      faqTitle: "คำถามที่พบบ่อยเกี่ยวกับโรงงาน OEM สกินแคร์",
      faqs: [
        {
          question: "จะเลือกโรงงาน OEM สกินแคร์อย่างไรให้เหมาะกับแบรนด์?",
          answer:
            "เริ่มจากโรงงานที่ตรงกับประเภทผลิตภัณฑ์ดูแลผิวของคุณ มี MOQ ที่เหมาะกับงบประมาณ และสามารถสื่อสารรายละเอียดการผลิตได้ชัดเจน",
        },
        {
          question: "แบรนด์สกินแคร์ใหม่ควรเริ่มหาโรงงานแบบไหน?",
          answer:
            "ควรเริ่มจากโรงงานที่รับ MOQ ไม่สูงเกินไป เข้าใจสินค้าในหมวดสกินแคร์ และมีข้อมูลให้เปรียบเทียบก่อนเริ่มงานจริง",
        },
        {
          question: "ทำไมควรใช้ NEOEM เพื่อหาโรงงานสกินแคร์?",
          answer:
            "NEOEM ช่วยให้คุณเริ่มจากโรงงานที่ผ่านการตรวจสอบและต่อยอดไปยังขั้นตอนเจรจา เอกสาร และเครื่องมือที่ช่วยลดความเสี่ยงในการเลือกโรงงาน",
        },
      ],
      ctaTitle: "เริ่มหาโรงงาน OEM สกินแคร์ของคุณ",
      ctaDescription:
        "ดูรายชื่อโรงงานทั้งหมด หรือกลับไปหน้าคู่มือหลักเพื่อเปรียบเทียบหมวดโรงงาน OEM อื่น ๆ เพิ่มเติม",
      ctaPrimary: "ดูรายชื่อโรงงานทั้งหมด",
      ctaSecondary: "กลับไปคู่มือหาโรงงาน OEM",
    };
  }

  return {
    badge: "Skincare OEM factories",
    title: "Find Skincare OEM Factories in Thailand",
    description:
      "Explore skincare OEM factories in Thailand and compare category fit, MOQ, and trust signals before launching your skincare brand.",
    intro:
      "If you are building a skincare brand for serums, creams, lotions, or adjacent categories, this page helps you start with factories that are closer to your product type.",
    highlights: [
      {
        title: "Start with skincare-fit factories",
        description: "Focus on manufacturers whose profiles align with skincare and adjacent personal-care categories.",
        icon: ShieldCheck,
      },
      {
        title: "Compare MOQ against your launch plan",
        description: "See whether a factory fits your first production run, budget, and growth expectations.",
        icon: Factory,
      },
      {
        title: "Move into real workflows faster",
        description: "Continue from sourcing into outreach, documents, and decision support inside NEOEM.",
        icon: FileText,
      },
    ],
    sectionTitle: "How to choose a skincare OEM factory",
    sectionDescription:
      "The right skincare factory should match your product type, have workable MOQ, and provide enough detail for you to assess credibility before production.",
    checklistTitle: "Skincare factories to explore on NEOEM",
    checklist: [
      "Check for experience in skincare products such as serums, creams, lotions, or adjacent care categories",
      "Compare MOQ with your launch budget and the risk of the first production run",
      "Review trust signals, certifications, and communication readiness before outreach",
      "Prepare your product concept, positioning, and expected price range before contacting factories",
    ],
    faqTitle: "Common questions about skincare OEM factories",
    faqs: [
      {
        question: "How do I choose the right skincare OEM factory?",
        answer:
          "Start with skincare category fit, workable MOQ, and clear communication. The best fit should support your launch size and product direction.",
      },
      {
        question: "What kind of skincare factory is best for a new brand?",
        answer:
          "New skincare brands often need factories with manageable MOQ, strong category alignment, and enough detail to compare options before committing.",
      },
      {
        question: "Why use NEOEM to find skincare factories?",
        answer:
          "NEOEM helps brands begin with verified factory discovery and move into sourcing workflows with more confidence and context.",
      },
    ],
    ctaTitle: "Start sourcing a skincare OEM factory",
    ctaDescription:
      "Browse all factories or return to the main OEM guide to compare other manufacturing categories.",
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
    pathname: "oem-skincare-factory",
    title: copy.title,
    description: copy.description,
    keywords: isThaiLocale(locale)
      ? [
          "โรงงาน OEM สกินแคร์",
          "หาโรงงาน OEM สกินแคร์",
          "โรงงานสกินแคร์",
          "โรงงานผลิตสกินแคร์",
          "NEOEM",
        ]
      : [
          "skincare OEM factory Thailand",
          "find skincare manufacturer Thailand",
          "serum manufacturer Thailand",
          "cream manufacturer Thailand",
          "NEOEM",
        ],
  });
}

export default async function OemSkincareFactoryPage({
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
      return categoryId === "skincare" || categoryId === "cosmetics" || searchable.includes("skin care") || searchable.includes("skincare");
    })
    .slice(0, 4);

  return (
    <OemCategoryLandingPage
      locale={locale}
      pathname="oem-skincare-factory"
      copy={copy}
      factories={factories}
    />
  );
}
