"use client";

import React from "react";
import type { TechnicalQuestionImageKey } from "./technicalQuestions";

type TechnicalQuestionIllustrationProps = {
  imageKey: TechnicalQuestionImageKey;
  title: string;
  hint: string;
  revealTarget: boolean;
};

const Panel = ({
  children,
  title,
  hint,
}: {
  children: React.ReactNode;
  title: string;
  hint: string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{hint}</p>
    </div>
    <div className="relative aspect-[16/9] bg-[radial-gradient(circle_at_top,_#ffffff,_#eef4ff_58%,_#dde7f7)]">
      {children}
    </div>
  </div>
);

const Callout = ({
  x,
  y,
  label,
  revealTarget,
}: {
  x: number;
  y: number;
  label: string;
  revealTarget: boolean;
}) => (
  <g opacity={revealTarget ? 1 : 0.15} className="transition-opacity duration-300">
    <circle cx={x} cy={y} r="26" fill="#ef4444" fillOpacity="0.18" />
    <circle cx={x} cy={y} r="16" fill="#ef4444" fillOpacity="0.82" />
    <circle cx={x} cy={y} r="7" fill="#fff" />
    <rect x={x + 24} y={y - 44} rx="10" width="150" height="34" fill="#111827" />
    <text x={x + 36} y={y - 22} fill="#fff" fontSize="15" fontWeight="700">
      {label}
    </text>
    <path d={`M ${x + 24} ${y - 18} L ${x + 8} ${y - 4}`} stroke="#111827" strokeWidth="4" strokeLinecap="round" />
  </g>
);

const EngineBay = ({
  revealTarget,
  focus,
}: {
  revealTarget: boolean;
  focus: "oil" | "brake-fluid" | "coolant" | "washer";
}) => {
  const labels = {
    oil: { x: 210, y: 226, text: "ზეთის ცეცი" },
    "brake-fluid": { x: 452, y: 116, text: "სამუხრუჭე სითხე" },
    coolant: { x: 496, y: 214, text: "გაგრილების სითხე" },
    washer: { x: 118, y: 112, text: "მინამრეცხის ავზი" },
  } as const;

  const active = labels[focus];

  return (
    <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dbe7f5" />
          <stop offset="100%" stopColor="#bfccdc" />
        </linearGradient>
        <linearGradient id="engine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#25364d" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>
      <path d="M80 78 C180 24, 460 24, 560 78 L520 118 C445 90, 195 90, 120 118 Z" fill="url(#hood)" />
      <rect x="88" y="114" width="464" height="172" rx="36" fill="#d9e3ee" />
      <rect x="134" y="138" width="372" height="128" rx="28" fill="url(#engine)" />
      <rect x="104" y="96" width="40" height="102" rx="16" fill="#7fb3ff" />
      <circle cx="122" cy="110" r="12" fill="#2563eb" />
      <rect x="456" y="88" width="58" height="70" rx="16" fill="#f9fafb" stroke="#475569" strokeWidth="4" />
      <path d="M482 88 L482 70" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
      <rect x="474" y="182" width="60" height="74" rx="18" fill="#f8fafc" stroke="#64748b" strokeWidth="4" />
      <circle cx="504" cy="192" r="14" fill="#22c55e" />
      <path d="M198 236 L238 236" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
      <path d="M228 216 L246 236 L228 256" fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="258" y="156" width="110" height="80" rx="18" fill="#334155" />
      <rect x="378" y="152" width="62" height="74" rx="18" fill="#475569" />
      <rect x="170" y="146" width="64" height="58" rx="16" fill="#475569" />
      <Callout x={active.x} y={active.y} label={active.text} revealTarget={revealTarget} />
    </svg>
  );
};

const CabinPedals = ({ revealTarget }: { revealTarget: boolean }) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <rect x="70" y="46" width="500" height="90" rx="26" fill="#d9e3ee" />
    <rect x="116" y="84" width="118" height="30" rx="14" fill="#94a3b8" />
    <circle cx="286" cy="90" r="42" fill="#1e293b" />
    <circle cx="286" cy="90" r="20" fill="#94a3b8" />
    <rect x="156" y="200" width="48" height="112" rx="18" fill="#1e293b" />
    <rect x="276" y="170" width="72" height="144" rx="20" fill="#1e293b" />
    <rect x="412" y="182" width="48" height="132" rx="18" fill="#1e293b" />
    <text x="145" y="340" fill="#64748b" fontSize="18" fontWeight="700">ქლაჩი</text>
    <text x="278" y="340" fill="#64748b" fontSize="18" fontWeight="700">მუხრუჭი</text>
    <text x="404" y="340" fill="#64748b" fontSize="18" fontWeight="700">გაზი</text>
    <Callout x={312} y={226} label="მუხრუჭის პედალი" revealTarget={revealTarget} />
  </svg>
);

const HandbrakeConsole = ({ revealTarget }: { revealTarget: boolean }) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <rect x="216" y="52" width="208" height="254" rx="42" fill="#cbd5e1" />
    <rect x="250" y="82" width="140" height="70" rx="26" fill="#334155" />
    <rect x="266" y="176" width="108" height="110" rx="24" fill="#475569" />
    <path d="M414 236 L492 170" stroke="#1f2937" strokeWidth="18" strokeLinecap="round" />
    <circle cx="500" cy="164" r="18" fill="#64748b" />
    <Callout x={450} y={202} label="ხელის მუხრუჭი" revealTarget={revealTarget} />
  </svg>
);

const TirePlacard = ({ revealTarget }: { revealTarget: boolean }) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <rect x="128" y="42" width="380" height="276" rx="28" fill="#dbeafe" stroke="#93c5fd" strokeWidth="6" />
    <rect x="182" y="78" width="108" height="206" rx="14" fill="#bfdbfe" />
    <rect x="314" y="94" width="138" height="118" rx="16" fill="#fff" stroke="#64748b" strokeWidth="4" />
    <text x="334" y="126" fill="#0f172a" fontSize="18" fontWeight="700">2.2 bar</text>
    <text x="334" y="158" fill="#334155" fontSize="16">წინა საბურავი</text>
    <text x="334" y="190" fill="#334155" fontSize="16">უკანა საბურავი</text>
    <Callout x={384} y={152} label="ფირნიშა / ინსტრუქცია" revealTarget={revealTarget} />
  </svg>
);

const TireCloseup = ({
  revealTarget,
  label,
}: {
  revealTarget: boolean;
  label: string;
}) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <circle cx="320" cy="186" r="118" fill="#0f172a" />
    <circle cx="320" cy="186" r="76" fill="#94a3b8" />
    <circle cx="320" cy="186" r="24" fill="#475569" />
    <path d="M234 86 L234 286 M270 74 L270 298 M370 74 L370 298 M406 86 L406 286" stroke="#1e293b" strokeWidth="10" />
    <path d="M202 160 L438 160 M202 212 L438 212" stroke="#1e293b" strokeWidth="10" />
    <rect x="486" y="84" width="40" height="164" rx="12" fill="#fff" stroke="#334155" strokeWidth="4" />
    <line x1="506" y1="94" x2="506" y2="238" stroke="#ef4444" strokeWidth="5" />
    <Callout x={430} y={124} label={label} revealTarget={revealTarget} />
  </svg>
);

const RearLights = ({ revealTarget }: { revealTarget: boolean }) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <rect x="104" y="124" width="432" height="138" rx="40" fill="#cbd5e1" />
    <rect x="152" y="148" width="88" height="50" rx="16" fill="#ef4444" />
    <rect x="402" y="148" width="88" height="50" rx="16" fill="#ef4444" />
    <rect x="178" y="210" width="286" height="22" rx="11" fill="#64748b" />
    <Callout x={446} y={172} label="დამუხრუჭების ნათურა" revealTarget={revealTarget} />
  </svg>
);

const SteeringWheelScene = ({
  revealTarget,
  label,
}: {
  revealTarget: boolean;
  label: string;
}) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <rect x="118" y="42" width="404" height="94" rx="28" fill="#dbe4ee" />
    <rect x="176" y="68" width="120" height="42" rx="18" fill="#94a3b8" />
    <rect x="330" y="68" width="120" height="42" rx="18" fill="#94a3b8" />
    <circle cx="320" cy="214" r="104" fill="none" stroke="#1e293b" strokeWidth="22" />
    <circle cx="320" cy="214" r="30" fill="#94a3b8" />
    <path d="M320 184 L320 298 M258 222 L320 214 L382 222" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    <Callout x={364} y={164} label={label} revealTarget={revealTarget} />
  </svg>
);

const CarFrontLights = ({
  revealTarget,
  label,
  lightColor,
}: {
  revealTarget: boolean;
  label: string;
  lightColor: string;
}) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <path d="M140 224 C160 122, 480 122, 500 224 L500 256 L140 256 Z" fill="#cbd5e1" />
    <rect x="178" y="184" width="90" height="38" rx="16" fill={lightColor} />
    <rect x="372" y="184" width="90" height="38" rx="16" fill={lightColor} />
    <rect x="132" y="214" width="32" height="30" rx="10" fill={lightColor} />
    <rect x="476" y="214" width="32" height="30" rx="10" fill={lightColor} />
    <rect x="252" y="206" width="136" height="22" rx="11" fill="#64748b" />
    <Callout x={418} y={202} label={label} revealTarget={revealTarget} />
  </svg>
);

const DashboardHazard = ({ revealTarget }: { revealTarget: boolean }) => (
  <svg viewBox="0 0 640 360" className="h-full w-full" aria-hidden="true">
    <rect x="106" y="64" width="428" height="110" rx="26" fill="#dbe4ee" />
    <rect x="226" y="114" width="188" height="144" rx="28" fill="#1e293b" />
    <rect x="270" y="146" width="100" height="72" rx="18" fill="#ef4444" />
    <path d="M320 164 L344 204 H296 Z" fill="#fff" />
    <circle cx="196" cy="150" r="18" fill="#f59e0b" />
    <circle cx="444" cy="150" r="18" fill="#f59e0b" />
    <circle cx="196" cy="228" r="18" fill="#f59e0b" />
    <circle cx="444" cy="228" r="18" fill="#f59e0b" />
    <Callout x={370} y={182} label="ავარიული ღილაკი / ციმციმა" revealTarget={revealTarget} />
  </svg>
);

const sceneForKey = (imageKey: TechnicalQuestionImageKey, revealTarget: boolean) => {
  switch (imageKey) {
    case "engine-oil":
      return <EngineBay revealTarget={revealTarget} focus="oil" />;
    case "brake-fluid":
      return <EngineBay revealTarget={revealTarget} focus="brake-fluid" />;
    case "coolant":
      return <EngineBay revealTarget={revealTarget} focus="coolant" />;
    case "washer-fluid":
      return <EngineBay revealTarget={revealTarget} focus="washer" />;
    case "brake-pedal":
      return <CabinPedals revealTarget={revealTarget} />;
    case "handbrake":
      return <HandbrakeConsole revealTarget={revealTarget} />;
    case "tire-placard":
      return <TirePlacard revealTarget={revealTarget} />;
    case "tire-condition":
      return <TireCloseup revealTarget={revealTarget} label="საბურავის დაზიანება / ცვეთა" />;
    case "tire-pressure":
      return <TireCloseup revealTarget={revealTarget} label="წნევა / მანომეტრი" />;
    case "tread-depth":
      return <TireCloseup revealTarget={revealTarget} label="პროტექტორის სიღრმე" />;
    case "brake-lights":
      return <RearLights revealTarget={revealTarget} />;
    case "power-steering":
      return <SteeringWheelScene revealTarget={revealTarget} label="საჭის მუშაობა" />;
    case "turn-signals":
      return <CarFrontLights revealTarget={revealTarget} label="მოხვევის შუქ-მაჩვენებელი" lightColor="#f59e0b" />;
    case "headlights":
      return <CarFrontLights revealTarget={revealTarget} label="ფარები / გაბარიტები" lightColor="#fef08a" />;
    case "hazard":
      return <DashboardHazard revealTarget={revealTarget} />;
    case "horn":
      return <SteeringWheelScene revealTarget={revealTarget} label="ხმოვანი სიგნალი" />;
    default:
      return <EngineBay revealTarget={revealTarget} focus="oil" />;
  }
};

export const TechnicalQuestionIllustration = ({
  imageKey,
  title,
  hint,
  revealTarget,
}: TechnicalQuestionIllustrationProps) => (
  <Panel title={title} hint={hint}>
    {sceneForKey(imageKey, revealTarget)}
  </Panel>
);

