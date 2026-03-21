import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By using Instruktori.ge, you agree to these Terms of Service. If you do not agree, please stop using the platform.",
  },
  {
    title: "2. Platform Role",
    content:
      "Instruktori.ge provides a marketplace that connects learners and instructors. We do not guarantee lesson availability, instructor performance, or exam outcomes.",
  },
  {
    title: "3. Accounts and Eligibility",
    content:
      "You are responsible for account security and accurate profile information. You must comply with local laws and provide truthful booking details.",
  },
  {
    title: "4. Bookings and Cancellations",
    content:
      "Lesson bookings, rescheduling, and cancellations are subject to availability and platform cancellation rules shown at checkout or dashboard pages.",
  },
  {
    title: "5. Payments and Refunds",
    content:
      "Pricing is shown before confirmation. Refund and payout handling follows the currently published payment and cancellation policies.",
  },
  {
    title: "6. Acceptable Use",
    content:
      "You must not misuse the platform, attempt unauthorized access, submit harmful content, or interfere with other users' bookings.",
  },
  {
    title: "7. Limitation of Liability",
    content:
      "To the maximum extent allowed by law, Instruktori.ge is not liable for indirect, incidental, or consequential damages arising from platform use.",
  },
  {
    title: "8. Changes to Terms",
    content:
      "We may update these terms from time to time. Continued use after updates means you accept the revised version.",
  },
  {
    title: "9. Contact",
    content:
      "For legal or support requests, contact support@instruktori.ge.",
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-[#F03D3D]">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-sm text-gray-500">Last updated: March 20, 2026</p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                <p className="mt-2 leading-7 text-gray-700">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-600">
            <p>
              You can also review our{" "}
              <Link href="../privacy-policy" className="font-semibold text-[#F03D3D] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
