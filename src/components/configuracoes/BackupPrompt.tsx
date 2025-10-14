import { useEffect, useState } from 'react';
import { useSupabaseConfiguracoes } from '@/hooks/useSupabaseConfiguracoes';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Database, AlertTriangle } from 'lucide-react';

export function BackupPrompt() {
  const { user } = useSupabaseAuth();
  const { configuracaoBackup } = useSupabaseConfiguracoes();
  const [showPrompt, setShowPrompt] = useState(false);
  const [diasDesdeBackup, setDiasDesdeBackup] = useState(0);

  useEffect(() => {
    if (!user?.id || !configuracaoBackup?.backup_automatico) return;

    const verificarBackup = () => {
      const agora = new Date();
      let deveMostrarBackup = false;

      if (!configuracaoBackup.ultimo_backup) {
        // Nunca fez backup
        deveMostrarBackup = true;
        setDiasDesdeBackup(0);
      } else {
        const ultimoBackup = new Date(configuracaoBackup.ultimo_backup);
        const diferencaDias = Math.floor((agora.getTime() - ultimoBackup.getTime()) / (1000 * 60 * 60 * 24));
        setDiasDesdeBackup(diferencaDias);

        // Verificar se passou do tempo programado
        switch (configuracaoBackup.frequencia_backup) {
          case 'diario':
            deveMostrarBackup = diferencaDias >= 1;
            break;
          case 'semanal':
            deveMostrarBackup = diferencaDias >= 7;
            break;
          case 'mensal':
            deveMostrarBackup = diferencaDias >= 30;
            break;
        }
      }

      // Mostrar apenas uma vez por sessão
      const backupMostradoHoje = sessionStorage.getItem('backup_prompt_shown');
      if (deveMostrarBackup && !backupMostradoHoje) {
        setShowPrompt(true);
        sessionStorage.setItem('backup_prompt_shown', 'true');
      }
    };

    verificarBackup();
  }, [user?.id, configuracaoBackup]);

  const handleFechar = () => {
    setShowPrompt(false);
  };

  const handleIrParaBackup = () => {
    setShowPrompt(false);
    window.location.href = '/configuracoes?tab=backup';
  };

  if (!showPrompt) return null;

  return (
    <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-xl">
              Hora de Fazer Backup!
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-base">
            {diasDesdeBackup === 0 ? (
              <p>Você ainda não realizou nenhum backup dos seus dados.</p>
            ) : (
              <p>
                Já se passaram <strong>{diasDesdeBackup} dias</strong> desde o seu último backup.
              </p>
            )}
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" />
                <span className="font-medium">Proteção dos seus dados</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Fazer backups regulares protege suas informações de clientes, agendamentos e dados financeiros.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Recomendamos fazer o backup {configuracaoBackup?.frequencia_backup === 'diario' ? 'diariamente' : 
                configuracaoBackup?.frequencia_backup === 'semanal' ? 'semanalmente' : 'mensalmente'}.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <button
            onClick={handleFechar}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto"
          >
            Lembrar Depois
          </button>
          <AlertDialogAction
            onClick={handleIrParaBackup}
            className="w-full sm:w-auto"
          >
            <Database className="h-4 w-4 mr-2" />
            Fazer Backup Agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
