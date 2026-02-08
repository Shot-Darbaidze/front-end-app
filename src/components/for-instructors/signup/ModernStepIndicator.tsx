"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: { number: number; title: string }[];
}

const ModernStepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="mb-12 max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-10" />
        
        {/* Active Progress Bar */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#F03D3D] rounded-full -z-10 transition-all duration-500 ease-in-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          
          return (
            <div key={step.number} className="relative flex flex-col items-center gap-2">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted ? "border-[#F03D3D] bg-[#F03D3D] text-white" : "bg-white"}
                  ${isCurrent ? "border-[#F03D3D] text-[#F03D3D] scale-110 shadow-lg shadow-red-500/20" : ""}
                  ${!isCompleted && !isCurrent ? "border-gray-200 text-gray-400" : ""}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <span className="font-bold">{step.number}</span>}
              </div>
              <span 
                className={`
                  text-xs font-bold uppercase tracking-wider absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 text-center transition-colors duration-300
                  ${isCurrent ? "text-[#F03D3D]" : "text-gray-400"}
                `}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModernStepIndicator;
