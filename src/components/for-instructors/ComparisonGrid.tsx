"use client";

import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocaleHref } from "@/hooks/useLocaleHref";

const ComparisonGrid = () => {
  const { t } = useLanguage();
  const localeHref = useLocaleHref();
  
  const features = [
    {
      name: t("comparison.timeManagement"),
      solo: t("comparison.timeManagementSolo"),
      platform: t("comparison.timeManagementPlatform")
    },
    {
      name: t("comparison.adminWork"),
      solo: t("comparison.adminWorkSolo"),
      platform: t("comparison.adminWorkPlatform")
    },
    {
      name: t("comparison.studentAcquisition"),
      solo: t("comparison.studentAcquisitionSolo"),
      platform: t("comparison.studentAcquisitionPlatform")
    },
    {
      name: t("comparison.monthlyIncome"),
      solo: t("comparison.monthlyIncomeSolo"),
      platform: t("comparison.monthlyIncomePlatform")
    },
    {
      name: t("comparison.paymentProcessing"),
      solo: t("comparison.paymentProcessingSolo"),
      platform: t("comparison.paymentProcessingPlatform")
    },
    {
      name: t("comparison.support"),
      solo: t("comparison.supportSolo"),
      platform: t("comparison.supportPlatform")
    },
    {
      name: t("comparison.analytics"),
      solo: t("comparison.analyticsSolo"),
      platform: t("comparison.analyticsPlatform")
    },
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            {t("comparison.title")} <span className="text-[#F03D3D]">{t("comparison.titleHighlight")}</span>
          </h2>
          <p className="text-base md:text-xl text-gray-500 leading-relaxed">
            {t("comparison.description")}
          </p>
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-6 px-6 font-bold text-gray-900 text-lg">
                  {t("comparison.feature")}
                </th>
                <th className="text-center py-6 px-6 font-bold text-gray-900 text-lg">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <span>{t("comparison.soloTeaching")}</span>
                  </div>
                </th>
                <th className="text-center py-6 px-6 font-bold text-gray-900 text-lg bg-red-50 rounded-tr-xl">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#F03D3D]" />
                    <span>{t("comparison.platform")}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100"
                >
                  <td className="py-6 px-6 font-semibold text-gray-900">
                    {feature.name}
                  </td>
                  <td className="py-6 px-6 text-gray-600 text-center">
                    <span className="inline-block max-w-xs">{feature.solo}</span>
                  </td>
                  <td className="py-6 px-6 text-gray-600 text-center bg-red-50/30">
                    <span className="inline-block max-w-xs text-[#F03D3D] font-medium">
                      {feature.platform}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Comparison Cards */}
        <div className="md:hidden space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-bold text-gray-900">
                {feature.name}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-600 text-sm">{feature.solo}</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F03D3D] flex-shrink-0 mt-0.5" />
                  <p className="text-[#F03D3D] font-medium text-sm">{feature.platform}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            {t("comparison.ctaText")}
          </p>
          <Link
            href={localeHref("/for-instructors/signup")}
            className="inline-flex px-8 py-4 bg-[#F03D3D] text-white rounded-xl font-bold hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            {t("comparison.ctaButton")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ComparisonGrid;
