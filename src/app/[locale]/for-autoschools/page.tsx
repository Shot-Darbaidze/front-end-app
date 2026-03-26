"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  UserPlus,
  FileCheck,
  Users,
  BarChart3,
  Shield,
  Calendar,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { useLocaleHref } from "@/hooks/useLocaleHref";
import { useState } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Hero Section
// ──────────────────────────────────────────────────────────────────────────────

function Hero() {
  const localeHref = useLocaleHref();

  return (
    <section className="relative bg-[#0F172A] pt-32 pb-20 px-6 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F03D3D]/5 skew-x-12 transform origin-top-right" />
      <div className="absolute bottom-0 -left-32 sm:-left-10 md:left-0 w-2/3 sm:w-1/2 md:w-1/3 h-1/2 bg-blue-500/5 -skew-x-12 transform origin-bottom-left" />

      <div className="relative max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Building2 className="w-4 h-4 text-[#F03D3D]" />
            აუტოსკოლებისთვის
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            მართეთ თქვენი აუტოსკოლა{" "}
            <span className="text-[#F03D3D]">ციფრულ პლატფორმაზე</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            გაზარდეთ მოსწავლეთა ნაკადი, მართეთ ინსტრუქტორები და პაკეტები — 
            ყველაფერი ერთი პანელიდან. შეუერთდით საქართველოს #1 სასწავლო პლატფორმას.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={localeHref("/autoschools/apply")}
              className="px-8 py-4 bg-[#F03D3D] text-white rounded-xl font-bold hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              სკოლის რეგისტრაცია
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all backdrop-blur-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChevronDown className="w-5 h-5 text-[#F03D3D]" />
              როგორ მუშაობს?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Stats Bar
// ──────────────────────────────────────────────────────────────────────────────

function StatsBar() {
  const STATS = [
    { value: "50+", label: "რეგისტრირებული სკოლა" },
    { value: "200+", label: "ინსტრუქტორი" },
    { value: "5,000+", label: "აქტიური მოსწავლე" },
    { value: "24/7", label: "ონლაინ დაჯავშნა" },
  ];

  return (
    <section className="bg-[#0F172A] py-16 px-6 border-y border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-gray-400 font-medium uppercase tracking-wider text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// How It Works
// ──────────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const localeHref = useLocaleHref();
  const STEPS = [
    {
      icon: FileCheck,
      title: "გაიარეთ რეგისტრაცია",
      desc: "შეავსეთ განაცხადი — სკოლის სახელი, ქალაქი, საკონტაქტო ინფორმაცია და ლოგო.",
    },
    {
      icon: Shield,
      title: "გაიარეთ ვერიფიკაცია",
      desc: "ჩვენი გუნდი გადაამოწმებს თქვენს მონაცემებს 1-2 სამუშაო დღის განმავლობაში.",
    },
    {
      icon: UserPlus,
      title: "მოიწვიეთ ინსტრუქტორები",
      desc: "დაამატეთ თქვენი ინსტრუქტორები — ისინი ავტომატურად გამოჩნდებიან სკოლის გვერდზე.",
    },
    {
      icon: Users,
      title: "მოიზიდეთ მოსწავლეები",
      desc: "თქვენი სკოლა ხელმისაწვდომი ხდება ათასობით მოსწავლისთვის ონლაინ ძიებაში.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#F03D3D] text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F03D3D]" />
            </span>
            როგორ მუშაობს
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            4 ნაბიჯი <span className="text-[#F03D3D]">წარმატებამდე</span>
          </h2>
          <p className="text-base md:text-xl text-gray-500 leading-relaxed">
            რეგისტრაციის პროცესი მარტივი და სწრაფია — დაიწყეთ უფასოდ.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-gray-200 via-[#F03D3D]/20 to-gray-200 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 flex items-center justify-center mb-8 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">
                    {i + 1}
                  </div>
                </div>
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-transparent w-full">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href={localeHref("/autoschools/apply")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#F03D3D] text-white rounded-full font-bold text-lg shadow-lg shadow-red-500/25 hover:bg-red-600 active:scale-95 transition-all"
          >
            დაიწყეთ ახლავე <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-400">რეგისტრაცია უფასოა</p>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Features Grid
// ──────────────────────────────────────────────────────────────────────────────

function FeaturesGrid() {
  const FEATURES = [
    {
      icon: BarChart3,
      title: "სკოლის პროფილი",
      desc: "სრული ციფრული პროფილი — ლოგო, აღწერა, სერვისის პაკეტები, სამუშაო საათები და ინსტრუქტორთა სია.",
      accent: "from-red-500/10 to-red-500/5",
    },
    {
      icon: Users,
      title: "ინსტრუქტორების მართვა",
      desc: "მოიწვიეთ, დაამატეთ ან წაშალეთ ინსტრუქტორები ერთი ღილაკით. თითოეულს აქვს საკუთარი პროფილი.",
      accent: "from-blue-500/10 to-blue-500/5",
    },
    {
      icon: CreditCard,
      title: "პაკეტები და ფასები",
      desc: "შექმენით სასწავლო პაკეტები ფასდაკლებით, პოპულარობის ნიშნულით და დეტალური აღწერით.",
      accent: "from-green-500/10 to-green-500/5",
    },
    {
      icon: Calendar,
      title: "ონლაინ დაჯავშნა",
      desc: "მოსწავლეები პირდაპირ ჯავშნიან თქვენი ინსტრუქტორების განრიგში — 24/7, ტელეფონის გარეშე.",
      accent: "from-purple-500/10 to-purple-500/5",
    },
    {
      icon: Shield,
      title: "ვერიფიცირებული ბეჯი",
      desc: "ვერიფიკაციის შემდეგ თქვენი სკოლა იღებს სანდოობის ბეჯს — მოსწავლეთა ნდობა იზრდება.",
      accent: "from-yellow-500/10 to-yellow-500/5",
    },
    {
      icon: Building2,
      title: "თანამშრომლების პროფილები",
      desc: "ინსტრუქტორ-თანამშრომლებს არ სჭირდებათ ცალკე რეგისტრაცია — სკოლა ქმნის მათ პროფილს.",
      accent: "from-indigo-500/10 to-indigo-500/5",
    },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            რა მიიღებთ <span className="text-[#F03D3D]">პლატფორმაზე?</span>
          </h2>
          <p className="text-base md:text-xl text-gray-500 leading-relaxed">
            ყველა ფუნქცია, რაც საჭიროა თანამედროვე აუტოსკოლის მართვისთვის.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-gray-100 hover:border-gray-200 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-6`}>
                <f.icon className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// CTA Section
// ──────────────────────────────────────────────────────────────────────────────

function BottomCTA() {
  const localeHref = useLocaleHref();

  return (
    <section className="py-24 px-6 bg-[#0F172A] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#F03D3D]/5 skew-x-12 transform origin-top-right" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          მზად ხართ თქვენი სკოლის{" "}
          <span className="text-[#F03D3D]">ციფრული ტრანსფორმაციისთვის?</span>
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
          შეუერთდით 50+ აუტოსკოლას, რომლებიც უკვე იყენებენ ჩვენს პლატფორმას 
          მოსწავლეთა მოზიდვისა და მართვისთვის.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={localeHref("/autoschools/apply")}
            className="px-10 py-4 bg-[#F03D3D] text-white rounded-xl font-bold text-lg hover:bg-[#d62f2f] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            დარეგისტრირდით უფასოდ
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            უფასო რეგისტრაცია
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            1-2 დღეში ვერიფიკაცია
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ტექნიკური მხარდაჭერა
          </span>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const ITEMS = [
    {
      q: "რეგისტრაცია ფასიანია?",
      a: "არა, პლატფორმაზე რეგისტრაცია სრულიად უფასოა. თქვენ იხდით მხოლოდ კომისიას მოსწავლის ჯავშნისას.",
    },
    {
      q: "რამდენ ხანში მოხდება ვერიფიკაცია?",
      a: "ჩვეულებრივ 1-2 სამუშაო დღის განმავლობაში. ვერიფიკაციის შემდეგ თქვენი სკოლა ავტომატურად გამოჩნდება პლატფორმაზე.",
    },
    {
      q: "შემიძლია ინსტრუქტორების დამატება?",
      a: "დიახ, თქვენ შეგიძლიათ მოიწვიოთ ნებისმიერი რეგისტრირებული მომხმარებელი ინსტრუქტორად. მათ მიიღებენ მოწვევას და მოწვევის მიღების შემთხვევაში ავტომატურად დაემატებიან თქვენს სკოლას.",
    },
    {
      q: "შემიძლია ინსტრუქტორის გათავისუფლება?",
      a: "დიახ, თუ ინსტრუქტორს არ აქვს მომავალი დაჯავშნილი გაკვეთილები. სისტემა ავტომატურად ამოწმებს ამას.",
    },
    {
      q: "მოსწავლეები ჯავშნიან პირდაპირ ინსტრუქტორთან?",
      a: "დიახ. თქვენი ინსტრუქტორების პროფილები ხელმისაწვდომია ძიებაში. მოსწავლეები ირჩევენ და ჯავშნიან ონლაინ — არაფერის გაკეთება არ გჭირდებათ.",
    },
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            ხშირად დასმული <span className="text-[#F03D3D]">კითხვები</span>
          </h2>
        </div>

        <div className="space-y-3">
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-base font-semibold text-gray-900">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  open === i ? "max-h-40 pb-5" : "max-h-0"
                }`}
              >
                <p className="px-6 text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────

export default function ForAutoschoolsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeaturesGrid />
      <FAQ />
      <BottomCTA />
    </main>
  );
}
