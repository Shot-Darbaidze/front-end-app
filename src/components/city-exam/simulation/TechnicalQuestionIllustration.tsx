"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

type TechnicalQuestionIllustrationProps = {
  questionId: string;
  title: string;
  hint: string;
  revealTarget: boolean;
};

export const TechnicalQuestionIllustration = ({
  questionId,
  title,
  hint,
}: TechnicalQuestionIllustrationProps) => {
  const [hasError, setHasError] = useState(false);
  const photoPath = `/images/technical/${questionId}.jpg`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{hint}</p>
      </div>
      <div className="relative aspect-[16/9] bg-slate-100">
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <ImageOff className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">ფოტო ჯერ არ არის დამატებული</p>
            <p className="text-xs mt-1 text-slate-300">{photoPath}</p>
          </div>
        ) : (
          <Image
            src={photoPath}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  );
};
