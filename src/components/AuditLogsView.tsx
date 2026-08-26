import React from 'react';
import { AuditLog, EventData, UserProfile } from '../types';
import { 
  ScrollText, 
  Search, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  RefreshCw, 
  UserPlus, 
  XCircle,
  FileSpreadsheet,
  ShieldAlert,
  Sliders,
  Database
} from 'lucide-react';
import { SystemDangerZone } from './SystemDangerZone';

interface AuditLogsViewProps {
  logs: AuditLog[];
  currentEvent: EventData;
  allEvents: EventData[];
  currentUser: UserProfile;
  onDeleteCurrentEvent: (eventId: string) => void;
  onSystemResetForNewTenant: () => Promise<void>;
  cloudConnected?: boolean;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ 
  logs,
  currentEvent,
  allEvents,
  currentUser,
  onDeleteCurrentEvent,
  onSystemResetForNewTenant,
  cloudConnected = true,
}) => {
  const [search, setSearch] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState('all');
  const [activeSubTab, setActiveSubTab] = React.useState<'logs' | 'danger_zone'>('logs');

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.operator.toLowerCase().includes(search.toLowerCase()) ||
      (l.guestName && l.guestName.toLowerCase().includes(search.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const getActionBadge = (action: string, severity: string) => {
    switch (action) {
      case 'checkin_success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Check-in Liberado
          </span>
        );
      case 'checkin_duplicate_attempt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Tentativa Duplicada (Barrada)
          </span>
        );
      case 'whatsapp_sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Phone className="w-3.5 h-3.5" />
            WhatsApp Enviado
          </span>
        );
      case 'email_sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Mail className="w-3.5 h-3.5" />
            E-mail Disparado
          </span>
        );
      case 'bulk_imported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Importação em Massa
          </span>
        );
      case 'qr_reissued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <RefreshCw className="w-3.5 h-3.5" />
            QR Code Reemitido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            Operação
          </span>
        );
    }
  };

  const handleExportLogs = () => {
    const headers = ['Data/Hora', 'Ação', 'Severidade', 'Operador', 'Dispositivo', 'Convidado', 'Detalhes'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.severity}"`,
      `"${l.operator}"`,
      `"${l.device}"`,
      `"${l.guestName || '-'}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Subtabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-blue-600" />
            <span>Controle, Segurança & Gestão de Dados</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trilha de auditoria em tempo real, exclusão de eventos de teste e reset geral para novos clientes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'logs'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="tab-sub-logs"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Logs de Auditoria ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('danger_zone')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'danger_zone'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
            id="tab-sub-danger-zone"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Apagar Evento & Reset Geral</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'danger_zone' ? (
        <SystemDangerZone
          currentEvent={currentEvent}
          allEvents={allEvents}
          currentUser={currentUser}
          onDeleteCurrentEvent={onDeleteCurrentEvent}
          onSystemResetForNewTenant={onSystemResetForNewTenant}
          cloudConnected={cloudConnected}
        />
      ) : (
        /* Filters & Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar em logs por operador, participante ou detalhe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Severidade:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="all">Todas ({logs.length})</option>
                  <option value="success">Sucesso</option>
                  <option value="warning">Alertas / Fraudes</option>
                  <option value="info">Informativos</option>
                </select>
              </div>

              <button
                onClick={handleExportLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data & Horário</th>
                  <th className="py-3 px-4">Tipo de Ação</th>
                  <th className="py-3 px-4">Operador Responsável</th>
                  <th className="py-3 px-4">Dispositivo</th>
                  <th className="py-3 px-4">Detalhes da Ocorrência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action, log.severity)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.operator}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {log.device}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
