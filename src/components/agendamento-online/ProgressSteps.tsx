import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  currentStep: number;
  steps: string[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Linha de progresso */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 mb-2",
                  "border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-background border-primary text-primary scale-110",
                  !isCompleted && !isCurrent && "bg-background border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{stepNumber}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium text-center transition-colors",
                  isCurrent && "text-primary",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
