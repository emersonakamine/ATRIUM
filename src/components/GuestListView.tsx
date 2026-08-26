import React from 'react';
import { Guest, TicketCategory, EventData, AuditLog, UserProfile, AuditActionType } from '../types';
import { CheckInProgressBar } from './CheckInProgressBar';
import { sound } from '../utils/audio';
import { generateQrDataUrl } from '../utils/qr';
import { getGuestInviteUrl } from '../utils/urlHelper';
import { 
  Search, 
  SlidersHorizontal, 
  Download, 
  UserPlus, 
  Upload, 
  Check, 
  X, 
  QrCode, 
  Send, 
  Phone, 
  Mail, 
  Eye, 
  ShieldAlert, 
  Trash2, 
  RefreshCw, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  FileSpreadsheet,
  Copy,
  AlertCircle,
  Ban,
  Unlock,
  AlertTriangle
} from 'lucide-react';

interface GuestListViewProps {
  guests: Guest[];
  categories: TicketCategory[];
  event: EventData;
  currentUser: UserProfile;
  onToggleCheckIn: (guestId: string, currentStatus: boolean) => void;
  onAddGuest: (newGuestData: Partial<Guest>) => void;
  onOpenImportModal: () => void;
  onReissueQr: (guestId: string) => void;
  onBlockGuest: (guestId: string) => void;
  onDeleteGuest: (guestId: string) => void;
  onLogAudit: (action: AuditActionType, details: string, guestId?: string, guestName?: string, severity?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const GuestListView: React.FC<GuestListViewProps> = ({
  guests,
  categories,
  event,
  currentUser,
  onToggleCheckIn,
  onAddGuest,
  onOpenImportModal,
  onReissueQr,
  onBlockGuest,
  onDeleteGuest,
  onLogAudit,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [checkInFilter, setCheckInFilter] = React.useState('all');
  
  // Modals
  const [selectedGuest, setSelectedGuest] = React.useState<Guest | null>(null);
  const [guestToDelete, setGuestToDelete] = React.useState<Guest | null>(null);
  const [guestQrDataUrl, setGuestQrDataUrl] = React.useState<string>('');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showColumnModal, setShowColumnModal] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = React.useState({
    name: true,
    orderId: true,
    ticketId: true,
    createdDate: true,
    category: true,
    status: true,
    checkInDate: true,
    checkInToggle: true,
    actions: true,
  });

  // New Guest Form State
  const [newGuest, setNewGuest] = React.useState({
    name: '',
    email: '',
    phone: '',
    ticketCategoryId: categories[0]?.id || 'cat_mkt',
    docNumber: '',
    companions: 0,
    notes: '',
  });

  // Filtered list
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = 
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phone.includes(searchQuery) ||
      guest.publicCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === 'all' || guest.ticketCategoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || guest.status === statusFilter;
    const matchesCheckIn = 
      checkInFilter === 'all' || 
      (checkInFilter === 'checked' && guest.isCheckedIn) ||
      (checkInFilter === 'pending' && !guest.isCheckedIn);

    return matchesSearch && matchesCat && matchesStatus && matchesCheckIn;
  });

  // Open Guest Details & generate QR
  const handleOpenGuestModal = async (guest: Guest) => {
    setSelectedGuest(guest);
    const qrUrl = await generateQrDataUrl(guest.qrPayloadToken);
    setGuestQrDataUrl(qrUrl);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name.trim()) return;

    onAddGuest(newGuest);
    setShowAddModal(false);
    setNewGuest({
      name: '',
      email: '',
      phone: '',
      ticketCategoryId: categories[0]?.id || 'cat_mkt',
      docNumber: '',
      companions: 0,
      notes: '',
    });
  };

  // Download Template CSV
  const handleDownloadTemplateCSV = () => {
    const catNames = categories.map(c => c.name);
    const primaryCat = catNames[0] || 'Geral / Convidados';
    const secondaryCat = catNames[1] || 'VIP / Área Exclusiva';
    const header = 'Nome Completo,E-mail,Telefone WhatsApp,Tipo de Ingresso,Documento (CPF/RG),Acompanhantes,ID do Pedido (Opcional)';
    const sampleRows = [
      `Mariana Costa,mariana.costa@empresa.com.br,+55 11 98822-3344,${primaryCat},332.112.445-90,0,`,
      `Lucas Albuquerque,lucas.albuquerque@tech.io,+55 21 97711-2233,${secondaryCat},441.552.663-12,1,`,
    ];
    const csvContent = '\uFEFF' + [header, ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `modelo_importacao_convidados_${event.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Nome', 'ID Pedido', 'ID Ingresso', 'Email', 'Telefone', 'Categoria', 'Status', 'Check-in Efetuado', 'Data Check-in', 'Operador'];
    const rows = filteredGuests.map(g => {
      const cat = categories.find(c => c.id === g.ticketCategoryId)?.name || 'Geral';
      return [
        `"${g.name}"`,
        `"${g.publicCode}"`,
        `"${g.qrPayloadToken}"`,
        `"${g.email}"`,
        `"${g.phone}"`,
        `"${cat}"`,
        `"${g.status}"`,
        `"${g.isCheckedIn ? 'Sim' : 'Não'}"`,
        `"${g.checkInTimestamp || '-'}"`,
        `"${g.checkInOperator || '-'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participantes_${event.code}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Check-in Progress Bar */}
      <CheckInProgressBar
        guests={guests}
        categories={categories}
        selectedCategoryId={categoryFilter}
        onSelectCategory={setCategoryFilter}
      />

      {/* Main Table Card (matching screenshot 1) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Controls Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Lista de participantes inscritos
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie credenciamento, check-in em tempo real e reemissão de convites
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input (matching screenshot 1: BUSCAR: Digite para buscar) */}
            <div className="relative flex-1 sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Buscar:
              </span>
              <input
                type="text"
                placeholder="Digite para buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-18 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Editar Colunas */}
            <button
              onClick={() => setShowColumnModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar colunas</span>
            </button>

            {/* Exportar */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar</span>
            </button>

            {/* Importar / Modelo de Planilha */}
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs">
              <button
                onClick={handleDownloadTemplateCSV}
                title="Baixar planilha modelo .CSV pré-configurada para preencher no Excel"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                id="btn-download-model-csv"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Planilha Modelo</span>
              </button>
              <div className="w-px h-4 bg-slate-200"></div>
              <button
                onClick={onOpenImportModal}
                title="Fazer upload ou colar planilha preenchida"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-md transition-colors cursor-pointer"
                id="btn-import-sheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Importar Planilha</span>
              </button>
            </div>

            {/* Adicionar Participante */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Adicionar participantes</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filtrar Check-in:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              <button
                onClick={() => setCheckInFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  checkInFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({guests.length})
              </button>
              <button
                onClick={() => setCheckInFilter('checked')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  checkInFilter === 'checked' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Efetuado ({guests.filter(g => g.isCheckedIn).length})
              </button>
              <button
                onClick={() => setCheckInFilter('pending')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  checkInFilter === 'pending' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendente ({guests.filter(g => !g.isCheckedIn).length})
              </button>
            </div>
          </div>

          <div className="text-slate-500 text-xs">
            Exibindo <strong className="text-slate-800 font-bold">{filteredGuests.length}</strong> de {guests.length} participantes
          </div>
        </div>

        {/* Dynamic Table (identical headers to screenshot 1) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                {visibleColumns.name && <th className="py-3 px-4">Nome do Participante</th>}
                {visibleColumns.orderId && <th className="py-3 px-4">ID. do Pedido</th>}
                {visibleColumns.ticketId && <th className="py-3 px-4">ID. do Ingresso</th>}
                {visibleColumns.createdDate && <th className="py-3 px-4">Data do Envio/Cadastro</th>}
                {visibleColumns.category && <th className="py-3 px-4">Tipo de Ingresso</th>}
                {visibleColumns.status && <th className="py-3 px-4">Status</th>}
                {visibleColumns.checkInDate && <th className="py-3 px-4">Data do Check-in</th>}
                {visibleColumns.checkInToggle && <th className="py-3 px-4 text-center">Check-in Efetuado</th>}
                {visibleColumns.actions && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum participante encontrado</p>
                    <p className="text-xs text-slate-400">Tente ajustar seus filtros ou cadastre um novo participante.</p>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const category = categories.find(c => c.id === guest.ticketCategoryId);

                  return (
                    <tr 
                      key={guest.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        guest.isCheckedIn ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Nome */}
                      {visibleColumns.name && (
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <button 
                            onClick={() => handleOpenGuestModal(guest)}
                            className="hover:text-blue-600 text-left font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{guest.name}</span>
                            {guest.companions > 0 && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                                +{guest.companions}
                              </span>
                            )}
                          </button>
                          <div className="text-[11px] font-normal text-slate-400 truncate max-w-[180px]">
                            {guest.email}
                          </div>
                        </td>
                      )}

                      {/* ID do Pedido */}
                      {visibleColumns.orderId && (
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {guest.publicCode.slice(0, 12)}...
                        </td>
                      )}

                      {/* ID do Ingresso */}
                      {visibleColumns.ticketId && (
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {guest.qrPayloadToken.split('-').pop() || guest.qrPayloadToken.slice(0, 10)}
                          </span>
                        </td>
                      )}

                      {/* Data de Envio / Cadastro */}
                      {visibleColumns.createdDate && (
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {guest.sentAt || guest.createdAt}
                        </td>
                      )}

                      {/* Tipo de Ingresso */}
                      {visibleColumns.category && (
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${category?.badgeBg || 'bg-slate-100 text-slate-700'}`}>
                            {category?.name || 'Geral'}
                          </span>
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className="py-3.5 px-4">
                          {guest.status === 'confirmed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Confirmado
                            </span>
                          )}
                          {guest.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              Pendente
                            </span>
                          )}
                          {guest.status === 'blocked' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800 border border-red-200">
                              Bloqueado
                            </span>
                          )}
                        </td>
                      )}

                      {/* Data do Check-in */}
                      {visibleColumns.checkInDate && (
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                          {guest.checkInTimestamp || (
                            <span className="text-slate-400 font-normal">--</span>
                          )}
                        </td>
                      )}

                      {/* Check-in Efetuado (Interactive Switch Toggle matching screenshot 1) */}
                      {visibleColumns.checkInToggle && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onToggleCheckIn(guest.id, guest.isCheckedIn)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              guest.isCheckedIn ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                            title={guest.isCheckedIn ? 'Check-in ativo (clique para cancelar)' : 'Realizar check-in manual'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                guest.isCheckedIn ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      )}

                      {/* Ações */}
                      {visibleColumns.actions && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenGuestModal(guest)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Visualizar Detalhes & QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            {/* WhatsApp Button with Desktop App / Web options */}
                            <button
                              onClick={() => {
                                const cleanPhone = guest.phone.replace(/\D/g, '');
                                const link = getGuestInviteUrl(guest.publicCode);
                                const msg = `Olá, *${guest.name}*! ✨\n\nSegue seu convite exclusivo com QR Code de acesso para o *${event.title}*:\n${link}\n\nApresente na portaria para entrar com agilidade.`;
                                if (cleanPhone) {
                                  window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
                                } else {
                                  window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Abrir no WhatsApp Desktop / App"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            
                            {/* Bloquear / Desbloquear Ingresso */}
                            <button
                              onClick={() => onBlockGuest(guest.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                guest.status === 'blocked'
                                  ? 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title={guest.status === 'blocked' ? 'Desbloquear Ingresso (Permitir Entrada)' : 'Bloquear Ingresso (Impedir Entrada)'}
                            >
                              {guest.status === 'blocked' ? (
                                <Unlock className="w-4 h-4" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>

                            {/* Excluir Definitivamente */}
                            <button
                              onClick={() => setGuestToDelete(guest)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Excluir Convidado Definitivamente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination summary (matching screenshot 1: Mostrando 1 a X participantes) */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Mostrando <strong>1 a {filteredGuests.length}</strong> de {filteredGuests.length} participantes
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-600 cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold border border-blue-200">1</span>
            <button className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-600 cursor-not-allowed">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Guest Details Modal with QR Code */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedGuest.name}</h3>
                  <p className="text-xs text-slate-500">Credencial & Convite Individual</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedGuest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* QR Code Canvas Frame */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                {guestQrDataUrl ? (
                  <img src={guestQrDataUrl} alt="QR Code" className="w-44 h-44 rounded-lg shadow-sm border border-white" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-400">Gerando QR...</div>
                )}
                <div className="mt-2 text-center">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-xs">
                    {selectedGuest.qrPayloadToken}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Versão QR: v{selectedGuest.qrVersion} • Criptografado & Antifraude
                  </div>
                </div>
              </div>

              {/* Status Bar in Modal */}
              <div className="p-3 rounded-xl border bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Status Check-in:</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    {selectedGuest.isCheckedIn ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Entrada Realizada ({selectedGuest.checkInTimestamp})
                      </span>
                    ) : (
                      <span className="text-amber-600">Aguardando na Portaria</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onToggleCheckIn(selectedGuest.id, selectedGuest.isCheckedIn);
                    setSelectedGuest({
                      ...selectedGuest,
                      isCheckedIn: !selectedGuest.isCheckedIn,
                      checkInTimestamp: !selectedGuest.isCheckedIn ? new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                    selectedGuest.isCheckedIn
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {selectedGuest.isCheckedIn ? 'Desmarcar Check-in' : 'Fazer Check-in Manual'}
                </button>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">E-mail</span>
                  <p className="font-semibold text-slate-800 truncate">{selectedGuest.email}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Telefone / WhatsApp</span>
                  <p className="font-semibold text-slate-800">{selectedGuest.phone}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Documento / CPF</span>
                  <p className="font-semibold text-slate-800">{selectedGuest.docNumber || 'Não informado'}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Acompanhantes</span>
                  <p className="font-semibold text-slate-800">+{selectedGuest.companions} pessoas</p>
                </div>
              </div>

              {/* Public Link Copy */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Link Exclusivo do Convite (Público)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getGuestInviteUrl(selectedGuest.publicCode)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 select-all"
                  />
                  <button
                    onClick={() => handleCopyText(getGuestInviteUrl(selectedGuest.publicCode), 'link')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shrink-0 cursor-pointer border border-slate-200"
                  >
                    {copiedField === 'link' ? 'Copiado!' : 'Copiar'}
                  </button>
                  <a
                    href={getGuestInviteUrl(selectedGuest.publicCode)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold shrink-0 cursor-pointer border border-emerald-200 inline-flex items-center gap-1"
                    title="Abrir página pública do convite"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir</span>
                  </a>
                </div>
              </div>
              {/* WhatsApp Quick Dispatch inside Modal */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">Disparo de Convite WhatsApp</span>
                  <span className="text-[11px] text-emerald-800">Enviar link interativo com QR Code para este convidado</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      const cleanPhone = selectedGuest.phone.replace(/\D/g, '');
                      const link = getGuestInviteUrl(selectedGuest.publicCode);
                      const msg = `Olá, *${selectedGuest.name}*! ✨\n\nSegue seu convite exclusivo com QR Code de acesso para o *${event.title}*:\n${link}\n\nApresente na portaria para entrar com agilidade.`;
                      window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Abrir diretamente no App do WhatsApp"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>App WhatsApp</span>
                  </button>
                  <a
                    href={`https://web.whatsapp.com/send?phone=${selectedGuest.phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Olá, *${selectedGuest.name}*! ✨\n\nSegue seu convite exclusivo com QR Code para o *${event.title}*:\n${getGuestInviteUrl(selectedGuest.publicCode)}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer"
                    title="Abrir no WhatsApp Web"
                  >
                    Web
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  onReissueQr(selectedGuest.id);
                  alert('Novo QR Code gerado! O código antigo foi imediatamente invalidado.');
                  setSelectedGuest(null);
                }}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                title="Invalidar código atual e gerar um novo token antifraude"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reemitir QR Code</span>
              </button>

              <button
                onClick={() => setSelectedGuest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Novo Convidado</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuestSubmit} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="joao@empresa.com"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Ingresso / Categoria</label>
                  <select
                    value={newGuest.ticketCategoryId}
                    onChange={(e) => setNewGuest({ ...newGuest, ticketCategoryId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF / Documento</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={newGuest.docNumber}
                    onChange={(e) => setNewGuest({ ...newGuest, docNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Acompanhantes</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={newGuest.companions}
                  onChange={(e) => setNewGuest({ ...newGuest, companions: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Convidado da diretoria, mesa 2"
                  value={newGuest.notes}
                  onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Salvar Convidado & Gerar QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Column Config Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Personalizar Colunas da Tabela</h3>
              <button onClick={() => setShowColumnModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              {Object.entries(visibleColumns).map(([key, isChecked]) => (
                <label key={key} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer">
                  <span className="capitalize text-slate-700 font-medium">{key}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Guest Confirmation Modal */}
      {guestToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">Excluir Participante?</h4>
              <p className="text-xs text-slate-500">
                Tem certeza de que deseja remover permanentemente este participante?
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-900">{guestToDelete.name}</div>
              <div className="text-slate-500">{guestToDelete.email || 'Sem e-mail'} • {guestToDelete.phone || 'Sem telefone'}</div>
              <div className="font-mono text-[11px] text-slate-600">ID: {guestToDelete.publicCode}</div>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Esta ação apagará o cadastro e invalidará o QR Code deste convidado na portaria e no banco de dados.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGuestToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGuest(guestToDelete.id);
                  setGuestToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                id="btn-confirm-delete-single-guest"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
