"use server";

export type InquiryState = {
  status: "idle" | "error" | "sent";
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  // Wire to a mailer / CRM when the studio has one. For now the inquiry is
  // recorded in the server log so nothing is silently dropped.
  console.log(`[forma-studio] Project inquiry from ${email}`);

  return { status: "sent", message: "Thank you — we’ll be in touch." };
}
