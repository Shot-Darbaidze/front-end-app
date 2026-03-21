import Link from "next/link";

const sections = [
  {
    title: "1. Information We Collect",
    content:
      "We may collect profile details, contact information, booking details, payment-related metadata, and technical usage data needed to operate the platform.",
  },
  {
    title: "2. How We Use Information",
    content:
      "Your data is used to provide account access, lesson booking, communication, fraud prevention, support, analytics, and legal compliance.",
  },
  {
    title: "3. Sharing of Information",
    content:
      "We share necessary information with instructors, payment providers, and service partners only as required to deliver platform functionality.",
  },
  {
    title: "4. Data Retention",
    content:
      "We retain data only as long as needed for platform operation, legal obligations, dispute resolution, and security purposes.",
  },
  {
    title: "5. Security",
    content:
      "We apply administrative and technical safeguards to protect personal data, but no online system can be guaranteed 100 percent secure.",
  },
  {
    title: "6. Your Rights",
    content:
      "Depending on applicable law, you may request access, correction, deletion, or restriction of processing for your personal data.",
  },
  {
    title: "7. Cookies and Tracking",
    content:
      "We may use cookies and similar technologies for authentication, security, preference storage, and performance analytics.",
  },
  {
    title: "8. Policy Updates",
    content:
      "This policy may be updated periodically. Material changes will be reflected by an updated effective date.",
  },
  {
    title: "9. Contact",
    content:
      "For privacy questions or requests, contact support@instruktori.ge.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-[#F03D3D]">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Privacy Policy</h1>
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
              <Link href="../terms-of-service" className="font-semibold text-[#F03D3D] hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
