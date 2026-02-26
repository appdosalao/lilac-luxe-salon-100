import { Badge } from '@/components/ui/badge';

export function getOrigemBadge(origem?: string) {
  switch (origem) {
    case 'online':
      return { label: 'Online', emoji: '🌐', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0' };
    case 'cronograma':
      return { label: 'Cronograma', emoji: '🔄', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0' };
    case 'manual':
      return { label: 'Manual', emoji: '✏️', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-0' };
    default:
      return null;
  }
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'agendado':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'concluido':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'cancelado':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'reagendado':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  }
}
