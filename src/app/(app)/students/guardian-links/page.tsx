import { requireAdmin } from "@/lib/auth";
import { normalizeIraqiWhatsappPhone } from "@/lib/contact-links";
import { PageHeader } from "@/components/layout/page-header";
import { listGuardianLinkStudents, type GuardianLinkStudent } from "@/services/guardian-link-service";
import {
  GuardianLinksSender,
  type GuardianLinkChild,
  type GuardianLinkGroup,
} from "./guardian-links-sender";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "روابط أولياء الأمور",
};

/** Normalized international number (e.g. 9647XXXXXXXXX), or null when it can't be a WhatsApp number. */
function getUsableWhatsappPhone(phone: string | null) {
  const normalized = normalizeIraqiWhatsappPhone(phone);
  return normalized && /^\d{10,15}$/.test(normalized) ? normalized : null;
}

function toChild(student: GuardianLinkStudent): GuardianLinkChild {
  return {
    id: student.id,
    fullName: student.fullName,
    classDisplay: student.classDisplay,
    token: student.guardianToken,
  };
}

/** Groups students by guardian phone so siblings receive one message. */
function groupByGuardianPhone(students: GuardianLinkStudent[]) {
  const groups = new Map<string, GuardianLinkGroup>();
  const withoutPhone: GuardianLinkChild[] = [];

  for (const student of students) {
    const phone = getUsableWhatsappPhone(student.contactPhone);
    if (!phone) {
      withoutPhone.push(toChild(student));
      continue;
    }

    const group = groups.get(phone);
    if (group) {
      group.children.push(toChild(student));
    } else {
      groups.set(phone, {
        phone,
        displayPhone: student.contactPhone ?? phone,
        children: [toChild(student)],
      });
    }
  }

  return { groups: Array.from(groups.values()), withoutPhone };
}

export default async function GuardianLinksPage() {
  await requireAdmin();
  const students = await listGuardianLinkStudents();
  const { groups, withoutPhone } = groupByGuardianPhone(students);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <PageHeader
        title="روابط أولياء الأمور"
        description="لكل طالب رابط سري يُرسل لولي الأمر مرة واحدة، ويعرض آخر الحضور والدرجات والأقساط في كل مرة يفتحه. الإخوة على نفس الرقم يصلهم رابط كل واحد منهم في رسالة واحدة."
        icon="students"
        badge="الطلاب الفعّالون"
        backHref="/students"
        backLabel="الطلاب"
      />

      <GuardianLinksSender groups={groups} withoutPhone={withoutPhone} />
    </div>
  );
}
