"use client";

type BookingMode = "package" | "single";

export type BookingOption = {
  id: string;
  name: string;
  lessons: number;
  percentage?: number;   // discount %, shown as "-X%" badge
  popular?: boolean;
  description: string;
};

interface BookingPricingCardProps {
  mode: BookingMode;
  selectedPackageId: string;
  packages: BookingOption[];
  onModeChange: (mode: BookingMode) => void;
  onPackageSelect: (packageId: string) => void;
}

export default function BookingPricingCard({
  mode,
  selectedPackageId,
  packages,
  onModeChange,
  onPackageSelect,
}: BookingPricingCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 mb-4">
        <button
          type="button"
          onClick={() => onModeChange("package")}
          className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            mode === "package" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          კურსი
        </button>
        <button
          type="button"
          onClick={() => onModeChange("single")}
          className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            mode === "single" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          სათითაო
        </button>
      </div>

      {mode === "package" ? (
        <div className="space-y-2">
          {packages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPackageSelect(item.id)}
              className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                selectedPackageId === item.id
                  ? "border-[#F03D3D] bg-[#F03D3D]/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                    {item.popular && (
                      <span className="text-[10px] font-bold text-white bg-[#F03D3D] px-1.5 py-0.5 rounded-md">
                        პოპულარული
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.lessons} გაკვ. · {item.description}
                  </p>
                </div>
                {item.percentage != null && item.percentage > 0 && (
                  <span className="shrink-0 text-xs font-bold text-white bg-emerald-500 px-2 py-1 rounded-lg">
                    -{item.percentage}%
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">სათითაო გაკვეთილი</p>
          <p className="text-xs text-gray-500 mt-1">1 გაკვეთილი · 60 წთ · ფასი ინსტრუქტორის მიხედვით</p>
        </div>
      )}
    </div>
  );
}
