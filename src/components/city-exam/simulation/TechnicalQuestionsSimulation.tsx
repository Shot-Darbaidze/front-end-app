"use client";

import React, { useState } from "react";
import { BookOpen, CheckCircle, Eye, Mic, RotateCcw, UserRound, XCircle } from "lucide-react";
import { TechnicalQuestionIllustration } from "./TechnicalQuestionIllustration";
import type { TechnicalQuestion } from "./technicalQuestions";

type TechnicalQuestionsSimulationProps = {
  questions: TechnicalQuestion[];
  sourceUrl: string;
  onComplete: (result: { score: number; mistakes: number }) => void;
};

type PracticeMode = "exam" | "bank";

const shuffleQuestions = (questions: TechnicalQuestion[]) => {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];

    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
};

export const TechnicalQuestionsSimulation = ({
  questions,
  sourceUrl,
  onComplete,
}: TechnicalQuestionsSimulationProps) => {
  const createSession = (mode: PracticeMode, options?: { randomize?: boolean }) => {
    if (mode === "bank") {
      return questions;
    }

    if (options?.randomize === false) {
      return questions.slice(0, 2);
    }

    return shuffleQuestions(questions).slice(0, 2);
  };

  const [mode, setMode] = useState<PracticeMode>("exam");
  // Keep the first SSR/CSR render deterministic to avoid hydration mismatches.
  const [sessionQuestions, setSessionQuestions] = useState<TechnicalQuestion[]>(() =>
    createSession("exam", { randomize: false })
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = sessionQuestions[currentQuestionIndex];
  const totalQuestions = sessionQuestions.length;
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  const resetSession = (nextMode: PracticeMode = mode) => {
    setMode(nextMode);
    setSessionQuestions(createSession(nextMode));
    setCurrentQuestionIndex(0);
    setAnswerVisible(false);
    setKnownCount(0);
    setRepeatCount(0);
    setIsComplete(false);
  };

  const completeQuestion = (knewAnswer: boolean) => {
    const nextKnownCount = knewAnswer ? knownCount + 1 : knownCount;
    const nextRepeatCount = knewAnswer ? repeatCount : repeatCount + 1;

    setKnownCount(nextKnownCount);
    setRepeatCount(nextRepeatCount);

    if (currentQuestionIndex + 1 >= totalQuestions) {
      const score = Math.round((nextKnownCount / totalQuestions) * 100);

      setIsComplete(true);
      onComplete({ score, mistakes: nextRepeatCount });
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setAnswerVisible(false);
  };

  if (isComplete) {
    const score = Math.round((knownCount / totalQuestions) * 100);

    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ტექნიკური კითხვების სესია დასრულდა</h2>
        <p className="text-gray-600 mb-6">
          {mode === "exam"
            ? "ეს იყო რეალური გამოცდის იმიტაცია: 2 ოფიციალური კითხვა."
            : "თქვენ გადახედეთ ტექნიკური კითხვების სრულ ოფიციალურ ბანკს."}
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-700">{score}%</p>
            <p className="text-sm text-green-600">ვიცოდი</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-700">{repeatCount}</p>
            <p className="text-sm text-amber-600">გასამეორებელი</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => resetSession(mode)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F03D3D] text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            იგივე რეჟიმის თავიდან გავლა
          </button>
          <button
            onClick={() => resetSession(mode === "exam" ? "bank" : "exam")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            {mode === "exam" ? "სრული ბანკის გავლა" : "2-კითხვიანი რეჟიმი"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F03D3D] mb-2">
              ოფიციალური ტექნიკური კითხვები
            </p>
            <h3 className="text-xl font-bold text-gray-900">გამომცდელის კითხვა მანქანამდე</h3>
            <p className="text-gray-600 mt-2 max-w-3xl">
              რეალურ გამოცდაზე ქალაქში გასვლამდე სვამენ 2 ტექნიკურ კითხვას. ამ ვარჯიშში შეგიძლია გაიარო
              საგამოცდო 2-კითხვიანი რეჟიმი ან მთლიანი ოფიციალური ბანკი.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => resetSession("exam")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "exam"
                  ? "bg-[#F03D3D] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              საგამოცდო რეჟიმი: 2 კითხვა
            </button>
            <button
              onClick={() => resetSession("bank")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === "bank"
                  ? "bg-[#F03D3D] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              სრული ბანკი: {questions.length} კითხვა
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            კითხვა {currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <span className="text-sm text-gray-500">
            ვიცოდი: {knownCount} | გასამეორებელი: {repeatCount}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-[#F03D3D] h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F03D3D]/10 flex items-center justify-center shrink-0">
                <UserRound className="w-6 h-6 text-[#F03D3D]" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center rounded-full bg-red-50 border border-red-100 px-2.5 py-1 text-xs font-semibold text-[#F03D3D]">
                    გამომცდელი
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {currentQuestion.responseMode === "ზეპირი პასუხი" ? <Mic className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {currentQuestion.responseMode}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    ოფიციალური კითხვა #{currentQuestion.officialNumber}
                  </span>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
                  <p className="text-gray-900 text-lg font-semibold leading-7">
                    {currentQuestion.prompt}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <TechnicalQuestionIllustration
            questionId={currentQuestion.id}
            title={currentQuestion.imageTitle}
            hint={currentQuestion.imageHint}
            revealTarget={answerVisible}
          />

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            {!answerVisible ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  ჯერ სცადე, ხმამაღლა უპასუხო ან სურათზე მიუთითო სწორ ადგილას, როგორც გამოცდაზე.
                </p>
                <button
                  onClick={() => setAnswerVisible(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#F03D3D] text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  პასუხის ჩვენება
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl bg-green-50 border border-green-200 p-5">
                  <p className="text-sm font-semibold text-green-800 mb-2">სავარჯიშო პასუხი</p>
                  <p className="text-green-900 leading-7">{currentQuestion.answer}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => completeQuestion(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    ვიცოდი
                  </button>
                  <button
                    onClick={() => completeQuestion(false)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    გასამეორებელია
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h4 className="font-bold text-gray-900">როგორ გამოიყენო ეს სიმულაცია</h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• ჯერ უპასუხე ისე, თითქოს გამომცდელი პირადად გეკითხება.</li>
              <li>• ზეპირი კითხვებისთვის მოკლედ აუხსენი ნაბიჯები.</li>
              <li>• ვიზუალური კითხვებისთვის სურათზე მოძებნე შესაბამისი ნაწილი.</li>
              <li>• პასუხის ნახვის შემდეგ მონიშნე, იცოდი თუ არა.</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h4 className="font-bold text-blue-900">ოფიციალური წყარო</h4>
            <p className="text-sm text-blue-800 mt-2">
              კითხვები და პასუხები დაფუძნებულია სსიპ მომსახურების სააგენტოს ტექნიკური კითხვების გვერდზე.
            </p>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-900 hover:text-blue-700 mt-4"
            >
              <BookOpen className="w-4 h-4" />
              წყაროს გახსნა
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h4 className="font-bold text-gray-900">სწრაფი შეხსენება</h4>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">საგამოცდო რეჟიმი</p>
                <p className="text-gray-600 mt-1">შემთხვევითი 2 კითხვა, როგორც რეალურ გამოცდაზე.</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">სრული ბანკი</p>
                <p className="text-gray-600 mt-1">ყველა ოფიციალური კითხვა ერთ სესიაში.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => resetSession(mode)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              თავიდან დაწყება
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
