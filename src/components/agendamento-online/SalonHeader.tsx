import { Camera } from 'lucide-react';
import { useState } from 'react';

export function SalonHeader() {
  const [imageError, setImageError] = useState(false);
  
  // Você pode substituir esta URL pela URL real da foto do salão
  const salonImageUrl = "/lovable-uploads/8a5121ab-d4ef-4272-be75-8450ce65f57a.png";

  return (
    <div className="w-full bg-gradient-to-br from-primary/10 via-primary/5 to-background py-8 px-4 mb-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo/Foto do Salão */}
        <div className="mb-4 flex justify-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-elegant">
            {!imageError ? (
              <img 
                src={salonImageUrl}
                alt="Logo do Salão"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                <Camera className="w-10 h-10 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Nome do Salão */}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Meu Salão
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Agende seu horário de forma rápida e prática
        </p>
      </div>
    </div>
  );
}
