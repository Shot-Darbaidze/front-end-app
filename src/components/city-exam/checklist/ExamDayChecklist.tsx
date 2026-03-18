"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  Info,
  Shield,
  Shirt,
  Smartphone,
  Target,
  XCircle,
} from "lucide-react";

const CHECKLIST_STORAGE_KEY = "city-exam-checklist:v1";

type ChecklistSection = {
  id: string;
  title: string;
  icon: typeof Clock;
  items: { id: string; label: string }[];
};

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: "before",
    title: "გამოცდამდე",
    icon: Target,
    items: [
      { id: "routes-done", label: "არჩეული ქალაქის მარშრუტები გავიარე (ვიდეო ან ადგილზე)" },
      { id: "simulations-done", label: "ყველა სიმულაცია მინიმუმ ერთხელ დავასრულე" },
      { id: "technical-questions", label: "20 ტექნიკური კითხვა ზეპირად ვიცი" },
      { id: "errors-studied", label: "მძიმე და მსუბუქი შეცდომების სია გადავხედე" },
      { id: "theory-revised", label: "საგზაო ნიშნები და მონიშვნები გადავიმეორე" },
      { id: "sleep-well", label: "გამოცდის წინა ღამეს კარგად დავიძინე" },
    ],
  },
  {
    id: "documents",
    title: "დოკუმენტები და ნივთები",
    icon: FileText,
    items: [
      { id: "id-card", label: "პირადობის მოწმობა / პასპორტი თან მაქვს" },
      { id: "booking-confirmed", label: "ჯავშანი დადასტურებული მაქვს (my.sa.gov.ge)" },
      { id: "comfortable-clothes", label: "კომფორტული ტანსაცმელი და ფეხსაცმელი" },
      { id: "phone-silent", label: "ტელეფონი ხმაამოუღებელზე / გამორთული" },
      { id: "water", label: "წყალი თან მაქვს" },
    ],
  },
  {
    id: "arrival",
    title: "მისვლისას",
    icon: Clock,
    items: [
      { id: "arrive-early", label: "მინიმუმ 15 წუთით ადრე მივედი" },
      { id: "calm-breathing", label: "ღრმა სუნთქვის ვარჯიში გავაკეთე" },
      { id: "no-rush", label: "არ ვჩქარობ, მშვიდად ველოდები" },
    ],
  },
  {
    id: "in-car",
    title: "მანქანაში ჯდომისას",
    icon: Shield,
    items: [
      { id: "seat-adjust", label: "სავარძელი მოვარგე" },
      { id: "mirrors-adjust", label: "სარკეები მოვაწესრიგე (შიდა + გარე)" },
      { id: "seatbelt", label: "ღვედი შევიკარი" },
      { id: "neutral-check", label: "ნეიტრალში ყოფნა შევამოწმე" },
      { id: "handbrake-check", label: "ხელის მუხრუჭი შევამოწმე" },
      { id: "doors-locked", label: "კარები დაკეტილია" },
    ],
  },
  {
    id: "during",
    title: "გამოცდის დროს — გახსოვდეს",
    icon: Heart,
    items: [
      { id: "mirrors-always", label: "სარკეებს ვაკვირდები ყოველ მანევრამდე" },
      { id: "signals-early", label: "სიგნალებს (მაშუქებს) დროულად ვრთავ" },
      { id: "blind-spot", label: "ბრმა ზონას ვამოწმებ ზოლის შეცვლამდე და დაძვრამდე" },
      { id: "pedestrians", label: "ქვეითებს გზას ვუთმობ გადასასვლელზე" },
      { id: "signs-obey", label: "ნიშნებს და მონიშვნებს ვემორჩილები" },
      { id: "speed-control", label: "სიჩქარეს ვაკონტროლებ — არც სწრაფად, არც ზედმეტად ნელა" },
      { id: "smooth-driving", label: "მშვიდად და კონტროლით ვმოძრაობ" },
      { id: "examiner-listen", label: "გამომცდელის მითითებას ყურადღებით ვუსმენ" },
      { id: "ask-if-unclear", label: "თუ ვერ გავიგე — მშვიდად ვეკითხები ხელახლა" },
      { id: "dont-panic", label: "შეცდომის შემდეგ არ ვნერვიულობ, ვაგრძელებ მშვიდად" },
    ],
  },
];

const InfoBox = ({
  icon: Icon,
  title,
  children,
  tone,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
  tone: "red" | "blue" | "amber" | "green";
}) => {
  const toneClasses = {
    red: "bg-red-50 border-red-200 text-red-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    green: "bg-green-50 border-green-200 text-green-900",
  };
  const iconClasses = {
    red: "text-red-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    green: "text-green-600",
  };

  return (
    <div className={`rounded-xl border p-4 ${toneClasses[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClasses[tone]}`} />
        <div>
          <p className="text-sm font-semibold mb-1">{title}</p>
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
};

export const ExamDayChecklist = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (stored) {
        setChecked(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const resetAll = useCallback(() => {
    setChecked({});
    window.localStorage.removeItem(CHECKLIST_STORAGE_KEY);
  }, []);

  const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">მზაობა</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {hydrated ? `${checkedCount}/${totalItems}` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#F03D3D]">
              {hydrated ? `${progressPercent}%` : "—"}
            </p>
            {checkedCount > 0 && (
              <button
                onClick={resetAll}
                className="text-xs text-gray-400 hover:text-red-500 mt-1 transition-colors"
              >
                გასუფთავება
              </button>
            )}
          </div>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F03D3D] to-green-500 transition-all duration-500"
            style={{ width: hydrated ? `${progressPercent}%` : "0%" }}
          />
        </div>
      </div>

      {/* Critical warnings */}
      <InfoBox icon={AlertTriangle} title="15 წუთით ადრე მისვლა სავალდებულოა!" tone="red">
        <p>
          დაგვიანების შემთხვევაში გამოცდაზე არ დაგიშვებენ და{" "}
          <strong>90-დღიანი დისკვალიფიკაცია</strong> დაგეკისრებათ.
        </p>
      </InfoBox>

      <InfoBox icon={Ban} title="ჩაჭრის პირობები" tone="amber">
        <ul className="space-y-1 mt-1">
          <li>
            <strong>1 მძიმე შეცდომა</strong> = გამოცდა მაშინვე წყდება
          </li>
          <li>
            <strong>12+ მსუბუქი შეცდომა</strong> = ჩაჭრა
          </li>
          <li>
            <strong>დისკვალიფიკაცია</strong> = გამომცდელის კანონიერი მითითების შეუსრულებლობა
          </li>
        </ul>
      </InfoBox>

      {/* Error reference */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          შეცდომების მოკლე რეფერენსი
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                მძიმე შეცდომები (1 = ჩაჭრა)
              </p>
            </div>
            <ul className="text-sm text-gray-700 space-y-1.5 ml-6">
              <li>• საჭის კონტროლის დაკარგვა</li>
              <li>• მარჯვნიდან გასწრება (გარდა ნებადართული შემთხვევისა)</li>
              <li>• შუქნიშნის / საგზაო ნიშნის / მონიშვნის იგნორირება</li>
              <li>• მარეგულირებლის მითითების შეუსრულებლობა</li>
              <li>• ქვეითთა გადასასვლელზე გასწრება</li>
              <li>• საშიში სიტუაციის შექმნა სხვა მონაწილეებისთვის</li>
              <li>• მოძრაობისას სარკის/სავარძლის მორგება</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                მსუბუქი შეცდომები (12+ = ჩაჭრა)
              </p>
            </div>
            <ul className="text-sm text-gray-700 space-y-1.5 ml-6">
              <li>• კარების შეუმოწმებლობა დაძვრამდე</li>
              <li>• გადაცემის დაგვიანებით გადართვა (1→2)</li>
              <li>• ღვედის არასწორად გამოყენება</li>
              <li>• სარკეების შეუმოწმებლობა</li>
              <li>• სიგნალის დაგვიანებით ჩართვა ან გამორთვა</li>
              <li>• არასწორი პოზიციონირება ზოლში</li>
              <li>• ზედმეტად ნელი მოძრაობა მოძრაობის შეფერხებით</li>
              <li>• ხელის მუხრუჭის არასწორად გამოყენება</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive checklist sections */}
      {CHECKLIST_SECTIONS.map((section) => {
        const SectionIcon = section.icon;
        const sectionChecked = section.items.filter((item) => checked[item.id]).length;
        const allDone = sectionChecked === section.items.length;

        return (
          <div
            key={section.id}
            className={`bg-white rounded-2xl p-5 shadow-sm border transition-colors ${
              allDone ? "border-green-300 bg-green-50/30" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SectionIcon
                  className={`w-4.5 h-4.5 ${allDone ? "text-green-600" : "text-[#F03D3D]"}`}
                />
                <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  allDone
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {sectionChecked}/{section.items.length}
              </span>
            </div>

            <div className="space-y-2">
              {section.items.map((item) => {
                const isChecked = !!checked[item.id];

                return (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                      isChecked
                        ? "bg-green-50 text-green-800"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isChecked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isChecked ? "line-through opacity-60" : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Practical info */}
      <InfoBox icon={Info} title="პრაქტიკული ინფორმაცია" tone="blue">
        <ul className="space-y-1 mt-1">
          <li>
            <strong>ღირებულება:</strong> 90 ლარი (ყოველ ცდაზე)
          </li>
          <li>
            <strong>დაჩქარებული ცდა:</strong> 250 ლარი (1 თვის შიგნით ხელახლა ჩაბარება)
          </li>
          <li>
            <strong>სიხშირე:</strong> თვეში ერთხელ (30 დღეში ერთხელ)
          </li>
          <li>
            <strong>გაუქმება:</strong> მინიმუმ 72 საათით ადრე
          </li>
          <li>
            <strong>ვადა:</strong> მოედნის ჩაბარებიდან 1 წელი (365 დღე)
          </li>
          <li>
            <strong>გამოუცხადებლობა:</strong> 50% თანხის დაბრუნება + 90 დღე დისკვალიფიკაცია
          </li>
        </ul>
      </InfoBox>

      <InfoBox icon={Smartphone} title="სასარგებლო ბმულები" tone="green">
        <ul className="space-y-1 mt-1">
          <li>
            <a
              href="https://my.sa.gov.ge"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:opacity-80"
            >
              my.sa.gov.ge
            </a>{" "}
            — ჯავშანი და გამოცდის სტატუსი
          </li>
          <li>
            <a
              href="https://www.sa.gov.ge/p/teqnikurigamartuloba"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:opacity-80"
            >
              sa.gov.ge — ტექნიკური კითხვები
            </a>{" "}
            — ოფიციალური 20 კითხვა
          </li>
          <li>
            <a
              href="https://teoria.on.ge/exam"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:opacity-80"
            >
              teoria.on.ge
            </a>{" "}
            — თეორიული გამოცდის პრაქტიკა
          </li>
          <li>
            <a
              href="https://emsi.ge/c/contents/martvis-mowmobis-gamocda"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:opacity-80"
            >
              emsi.ge
            </a>{" "}
            — გამოცდის შესახებ ინფორმაცია
          </li>
        </ul>
      </InfoBox>

      {/* Motivation */}
      <div className="bg-gradient-to-r from-[#F03D3D] to-red-600 rounded-2xl p-5 text-white text-center">
        <Shirt className="w-8 h-8 mx-auto mb-2 opacity-80" />
        <p className="font-bold text-lg mb-1">მშვიდად, კონცენტრირებულად!</p>
        <p className="text-sm text-white/80">
          სტრესი #1 მიზეზია ჩაჭრის. ნელა სუნთქე, ყურადღებით იმოქმედე და გახსოვდეს
          — შეცდომის შემდეგაც შეგიძლია კარგად გააგრძელო.
        </p>
      </div>
    </div>
  );
};
