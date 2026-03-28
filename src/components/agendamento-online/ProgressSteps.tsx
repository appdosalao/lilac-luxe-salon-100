import { Check, User, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStepsProps {
  currentStep: number;
  steps: string[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  const icons = [User, Calendar, CheckCircle2];

  return (
    <div className="w-full py-6 sm:py-8">
      <div className="flex items-center justify-between relative max-w-lg mx-auto px-4">
        {/* Linha de progresso de fundo */}
        <div className="absolute top-[22px] sm:top-[26px] left-0 right-0 h-2 bg-primary/10 -translate-y-1/2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.4)]"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const StepIcon = icons[index] || Check;

          return (
            <div key={stepNumber} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  "w-11 h-11 sm:w-14 sm:h-14 rounded-3xl flex items-center justify-center transition-all duration-700 ease-in-out",
                  "border-b-4 border-r-2 shadow-xl",
                  isCompleted && "bg-primary border-primary/50 text-white rotate-[360deg] scale-95",
                  isCurrent && "bg-white border-primary text-primary scale-110 ring-8 ring-primary/10 -translate-y-2",
                  !isCompleted && !isCurrent && "bg-muted border-muted/50 text-muted-foreground scale-90"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                ) : (
                  <StepIcon className={cn("w-6 h-6 sm:w-7 sm:h-7", isCurrent ? "animate-bounce" : "opacity-40")} />
                )}
              </div>
              
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max">
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-500",
                    isCurrent ? "text-primary opacity-100 translate-y-0 scale-110" : "text-muted-foreground opacity-50 translate-y-2"
                  )}
                >
                  {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
