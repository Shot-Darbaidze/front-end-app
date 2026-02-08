import { useState, useCallback } from 'react';

export const useMultiStepForm = <T extends Record<string, any>>(
  initialValues: T,
  totalSteps: number
) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<T>(initialValues);

  const handleNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, totalSteps]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleStepChange = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [totalSteps]
  );

  const handleFormDataChange = useCallback((newData: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData(initialValues);
  }, [initialValues]);

  return {
    currentStep,
    formData,
    handleNextStep,
    handlePreviousStep,
    handleStepChange,
    handleFormDataChange,
    resetForm,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    progress: Math.round((currentStep / totalSteps) * 100),
  };
};
