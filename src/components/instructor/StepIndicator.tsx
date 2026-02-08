"use client";

import React from "react";
import { CheckCircle } from "lucide-react";

interface Step {
  number: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="flex flex-col gap-8 pt-4">
      {steps.map((step, index) => (
        <div key={step.number}>
          {/* Step Circle */}
          <div
            onClick={() => onStepClick(step.number)}
            className="flex items-center gap-6 cursor-pointer"
          >
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl transition-all flex-shrink-0 ${
                step.number < currentStep
                  ? "bg-green-500 text-white"
                  : step.number === currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step.number < currentStep ? (
                <CheckCircle size={32} />
              ) : (
                step.number
              )}
            </div>
            <div>
              <p
                className={`text-lg font-bold ${
                  step.number === currentStep
                    ? "text-blue-600"
                    : step.number < currentStep
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {step.title}
              </p>
              <p className="text-sm text-gray-500 mt-1">Step {step.number}</p>
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex justify-center">
              <div
                className={`w-1.5 h-12 transition-all ${
                  step.number < currentStep ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
