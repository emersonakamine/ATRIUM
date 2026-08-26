import React from 'react';
import { TicketCategory, Guest } from '../types';
import ExcelJS from 'exceljs';
// @ts-ignore
import readXlsxFile from 'read-excel-file/browser';
import Papa from 'papaparse';
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Download,
  Sparkles,
  Info,
  QrCode,
  Layers,
  ArrowDownToLine,
  Check,
  FileUp,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface MassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TicketCategory[];
  onImportSuccess: (importedGuests: Array<Partial<Guest>>) => void;
  eventName?: string;
}

export const MassImportModal: React.FC<MassImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  onImportSuccess,
  eventName = 'Evento',
}) => {
  const [pasteData, setPasteData] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [downloadedTemplate, setDownloadedTemplate] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [importProgress, setImportProgress] = React.useState<number>(0);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [previewRows, setPreviewRows] = React.useState<Array<{
    name: string;
    email: string;
    phone: string;
    category: string;
    doc: string;
    companions: number;
    orderId?: string;
    isValid: boolean;
  }>>([]);

  // Reset state when opening modal
  React.useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setStatusMessage(null);
      setImportProgress(0);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Categories list formatted for sample
  const catNames = categories.map(c => c.name);
  const primaryCat = catNames[0] || 'MDS';
  const secondaryCat = catNames[1] || 'FCL';
  const thirdCat = catNames[2] || 'BP30';

  // Generate downloadable CSV content with BOM for Excel compatibility in Brazil
  const generateTemplateCSV = () => {
    const header = 'Nome Completo,E-mail,Telefone WhatsApp,Tipo de Ingresso,Documento (CPF/RG),Acompanhantes,ID do Pedido (Opcional)';
    const sampleRows = [
      `Acucena Roberta Polizel,11828563900@bellinatiperez.com.br,5541992215991,${primaryCat},11828563900,0,`,
      `Adaiane Bilibio,5488822909@bellinatiperez.com.br,5541997106420,${primaryCat},5488822909,0,`,
      `Adrian Henrique Zaia Andreatta,10285868926@bellinatiperez.com.br,5541999277051,${secondaryCat},10285868926,0,`,
      `Adriana Luiz Chiesorin,3408229961@bellinatiperez.com.br,5541984340566,${thirdCat},3408229961,0,`,
    ];
    return '\uFEFF' + [header, ...sampleRows].join('\r\n');
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateTemplateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `modelo_importacao_convidados_${eventName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedTemplate(true);
    setTimeout(() => setDownloadedTemplate(false), 3000);
  };

  const sampleCsvForTextarea = `Nome Completo\tE-mail\tTelefone WhatsApp\tTipo de Ingresso\tDocumento (CPF/RG)\tAcompanhantes\tID do Pedido (Opcional)
Acucena Roberta Polizel\t11828563900@bellinatiperez.com.br\t5541992215991\t${primaryCat}\t11828563900\t0\t
Adaiane Bilibio\t5488822909@bellinatiperez.com.br\t5541997106420\t${primaryCat}\t5488822909\t0\t
Adrian Henrique Zaia Andreatta\t10285868926@bellinatiperez.com.br\t5541999277051\t${secondaryCat}\t10285868926\t0\t
Adriana Luiz Chiesorin\t3408229961@bellinatiperez.com.br\t5541984340566\t${thirdCat}\t3408229961\t0\t`;

  const handleLoadSample = () => {
    setPasteData(sampleCsvForTextarea);
    setFileName(null);
    setErrorMessage(null);
    setStatusMessage('Dados de exemplo carregados!');
    parseRawText(sampleCsvForTextarea);
  };

  // Normalize string for header comparison
  const normalizeHeader = (str: string) => {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  };

  // Convert array of arrays (from Excel or CSV) into preview rows
  const processMatrixData = (matrix: any[][]) => {
    if (!matrix || matrix.length === 0) {
      setPreviewRows([]);
      setErrorMessage('Nenhum dado encontrado na planilha.');
      return;
    }

    // Filter out completely empty rows
    const nonEmptyRows = matrix.filter(row => 
      row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (nonEmptyRows.length === 0) {
      setPreviewRows([]);
      setErrorMessage('A planilha selecionada está vazia.');
      return;
    }

    // Determine column indices
    let nameIdx = 0;
    let emailIdx = 1;
    let phoneIdx = 2;
    let catIdx = 3;
    let docIdx = 4;
    let compIdx = 5;
    let orderIdx = 6;

    let startRow = 0;
    const firstRow = nonEmptyRows[0].map(c => (c !== null && c !== undefined) ? String(c) : '');
    const firstRowJoined = firstRow.map(normalizeHeader).join(' ');

    const isHeader = firstRowJoined.includes('nome') || 
                     firstRowJoined.includes('email') || 
                     firstRowJoined.includes('telefone') || 
                     firstRowJoined.includes('ingresso') || 
                     firstRowJoined.includes('categoria') || 
                     firstRowJoined.includes('documento') || 
                     firstRowJoined.includes('cpf');

    if (isHeader) {
      startRow = 1;
      firstRow.forEach((col, idx) => {
        const norm = normalizeHeader(col);
        if (norm.includes('nome')) nameIdx = idx;
        else if (norm.includes('mail')) emailIdx = idx;
        else if (norm.includes('tel') || norm.includes('whats') || norm.includes('cel')) phoneIdx = idx;
        else if (norm.includes('tipo') || norm.includes('ingresso') || norm.includes('cat')) catIdx = idx;
        else if (norm.includes('doc') || norm.includes('cpf') || norm.includes('rg')) docIdx = idx;
        else if (norm.includes('acomp')) compIdx = idx;
        else if (norm.includes('pedido') || norm.includes('ord')) orderIdx = idx;
      });
    }

    const dataRows = nonEmptyRows.slice(startRow);
    const parsed = dataRows.map((row) => {
      const getVal = (idx: number) => {
        if (idx < 0 || idx >= row.length || row[idx] === null || row[idx] === undefined) return '';
        return String(row[idx]).trim();
      };

      const name = getVal(nameIdx);
      const email = getVal(emailIdx);
      const phone = getVal(phoneIdx);
      const category = getVal(catIdx) || categories[0]?.name || 'Geral';
      const doc = getVal(docIdx);
      const rawComp = getVal(compIdx);
      const companions = parseInt(rawComp.replace(/\D/g, '') || '0') || 0;
      const orderId = getVal(orderIdx);

      return {
        name,
        email,
        phone,
        category,
        doc,
        companions,
        orderId,
        isValid: name.trim().length >= 2,
      };
    });

    const validCount = parsed.filter(p => p.isValid).length;
    setPreviewRows(parsed);

    if (validCount > 0) {
      setErrorMessage(null);
      setStatusMessage(`Sucesso! ${validCount} convidados válidos identificados e prontos para importação.`);
    } else {
      setErrorMessage('Não foi possível identificar nomes válidos nas linhas da planilha.');
    }
  };

  // Parse text using PapaParse (supports CSV, TSV, tab-delimited Excel paste, semicolon, comma)
  const parseRawText = (rawText: string) => {
    if (!rawText.trim()) {
      setPreviewRows([]);
      return;
    }

    try {
      const result = Papa.parse<string[]>(rawText.trim(), {
        skipEmptyLines: 'greedy',
      });

      if (result.data && result.data.length > 0) {
        processMatrixData(result.data);
      }
    } catch (err: any) {
      console.error('Error parsing text with PapaParse:', err);
      setErrorMessage('Erro ao analisar os dados colados. Verifique se o formato está correto.');
    }
  };

  // Universal parser supporting true .xlsx, .xls, .csv, tab-separated, and CSV-renamed-to-xlsx
  const parseFileWithAllEngines = async (file: File): Promise<any[][]> => {
    const isExcelExt = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    // Strategy 1: ExcelJS (robust binary xlsx parsing)
    if (isExcelExt) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (worksheet) {
          const matrix: any[][] = [];
          worksheet.eachRow({ includeEmpty: false }, (row) => {
            const rowVals: any[] = [];
            if (Array.isArray(row.values)) {
              for (let i = 1; i < row.values.length; i++) {
                const val = row.values[i];
                if (val !== null && typeof val === 'object') {
                  if ('text' in (val as any)) rowVals.push(String((val as any).text));
                  else if ('result' in (val as any)) rowVals.push(String((val as any).result));
                  else if ('richText' in (val as any)) rowVals.push((val as any).richText.map((t: any) => t.text).join(''));
                  else rowVals.push(String(val));
                } else {
                  rowVals.push(val !== undefined && val !== null ? String(val) : '');
                }
              }
            }
            if (rowVals.some(v => String(v).trim() !== '')) {
              matrix.push(rowVals);
            }
          });
          if (matrix.length > 0) {
            return matrix;
          }
        }
      } catch (errExcelJS) {
        console.warn('ExcelJS attempt finished, trying secondary parsers...', errExcelJS);
      }

      // Strategy 2: readXlsxFile
      try {
        const rows = (await readXlsxFile(file)) as unknown as any[][];
        if (rows && rows.length > 0) {
          return rows;
        }
      } catch (errReadXlsx) {
        console.warn('readXlsxFile attempt finished, trying CSV fallback...', errReadXlsx);
      }
    }

    // Strategy 3: PapaParse (handles CSV, TSV, or files saved with .xlsx extension that are text)
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        skipEmptyLines: 'greedy',
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            resolve(results.data as any[][]);
          } else {
            reject(new Error('Nenhum dado encontrado no arquivo.'));
          }
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  };

  // Handle File Upload (supports .xlsx, .xls, .csv, .txt, .tsv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setFileName(file.name);
    setIsProcessing(true);
    setStatusMessage(`Lendo arquivo "${file.name}"...`);

    try {
      const rows = await parseFileWithAllEngines(file);
      setIsProcessing(false);
      if (rows && rows.length > 0) {
        processMatrixData(rows);
      } else {
        setErrorMessage('A planilha selecionada está vazia ou sem linhas legíveis.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      console.error('Error in multi-engine file parse:', err);
      setErrorMessage('Não foi possível ler o arquivo. Você também pode copiar as células no Excel e colar diretamente na caixa de texto abaixo.');
    }

    // Reset file input value so user can re-upload same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = () => {
    const validRows = previewRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(`Gerando ${validRows.length} QR Codes e tokens antifraude...`);
    setImportProgress(25);

    setTimeout(() => {
      setImportProgress(60);
      setStatusMessage('Sincronizando com o banco de dados na nuvem...');
      
      setTimeout(() => {
        setImportProgress(100);
        const converted: Array<Partial<Guest>> = validRows.map(r => {
          // Match category case-insensitively or fallback
          const matchingCat = categories.find(
            c => c.name.toLowerCase().trim() === r.category.toLowerCase().trim()
          ) || categories[0];

          return {
            name: r.name,
            email: r.email,
            phone: r.phone,
            ticketCategoryId: matchingCat ? matchingCat.id : categories[0]?.id,
            docNumber: r.doc,
            companions: r.companions,
            publicCode: r.orderId ? r.orderId : undefined,
            status: 'confirmed',
            emailStatus: 'not_sent',
            whatsappStatus: 'not_sent',
          };
        });

        onImportSuccess(converted);
        setIsProcessing(false);
        onClose();
      }, 400);
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Importação em Massa de Convidados</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Excel (.xlsx) e CSV
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Faça o upload da planilha do Excel ou cole as linhas diretamente para cadastrar e gerar os QR Codes antifraude.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Card: Download Model + Explanation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                <ArrowDownToLine className="w-4 h-4 text-blue-600" />
                <span>Passo 1: Baixar a Planilha Modelo Pré-Configurada</span>
              </div>
              <p className="text-[11px] text-blue-800/80 leading-relaxed max-w-xl">
                A planilha modelo possui o formato correto das colunas (Nome, E-mail, Telefone, Tipo de Ingresso, Documento, Acompanhantes e ID do Pedido).
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
              id="btn-download-template-csv-modal"
            >
              {downloadedTemplate ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Modelo Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Planilha Modelo (.csv)</span>
                </>
              )}
            </button>
          </div>

          {/* Explanation: Auto Generated Fields */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>O que o sistema gera e preenche automaticamente na importação:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-slate-200/80 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-600" />
                  <span>ID do Ingresso & QR Code</span>
                </div>
                <p className="text-slate-500 text-[10px]">
                  Token criptografado exclusivo com antifraude gerado para cada convidado.
                </p>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200/80 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3 text-blue-600" />
                  <span>ID do Pedido</span>
                </div>
                <p className="text-slate-500 text-[10px]">
                  Criado automaticamente se estiver em branco na planilha.
                </p>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200/80 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-600" />
                  <span>Tipo de Ingresso</span>
                </div>
                <p className="text-slate-500 text-[10px]">
                  Vinculado automaticamente ao tipo do ingresso (ex: MDS, FCL, BP30, Geral, VIP).
                </p>
              </div>
            </div>
          </div>

          {/* Upload and Sample Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-blue-50/30 group relative">
              <Upload className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform mb-2" />
              <span className="text-xs font-bold text-slate-800">
                {fileName ? `Arquivo: ${fileName}` : 'Carregar Planilha Excel (.xlsx, .xls) ou .CSV'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Clique para selecionar o arquivo do seu computador
              </span>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx,.xls,.csv,.tsv,.txt" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Carregar Dados de Exemplo
                </span>
                <p className="text-slate-500 text-[11px] mt-1">
                  Preenche os campos abaixo com 4 participantes de teste para você validar o funcionamento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                className="mt-3 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg self-start transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Carregar 4 Linhas de Exemplo</span>
              </button>
            </div>
          </div>

          {/* Status Bar / Progress Indicator */}
          {(isProcessing || statusMessage || errorMessage) && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              {isProcessing && (
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                    style={{ width: importProgress > 0 ? `${importProgress}%` : '50%' }}
                  ></div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && !errorMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-semibold">{statusMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Raw Text / Copy & Paste from Excel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Ou copie e cole as células do seu Excel diretamente aqui:</span>
              <span className="text-[10px] text-slate-400 font-normal">Suporta Ctrl+C / Ctrl+V do Excel</span>
            </label>
            <textarea
              rows={3}
              value={pasteData}
              onChange={(e) => {
                setPasteData(e.target.value);
                setFileName(null);
                setErrorMessage(null);
                parseRawText(e.target.value);
              }}
              placeholder={`Nome Completo\tE-mail\tTelefone WhatsApp\tTipo de Ingresso\tDocumento (CPF/RG)\tAcompanhantes\nAcucena Roberta Polizel\t11828563900@bellinatiperez.com.br\t5541992215991\tMDS\t11828563900\t0`}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Pré-visualização da Importação ({previewRows.length} convidados detectados)
                </span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {previewRows.filter(r => r.isValid).length} válidos para geração de QR Code
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 border-b">Nome</th>
                      <th className="p-2 border-b">E-mail</th>
                      <th className="p-2 border-b">Telefone / WhatsApp</th>
                      <th className="p-2 border-b">Tipo de Ingresso</th>
                      <th className="p-2 border-b">Doc/CPF</th>
                      <th className="p-2 border-b">Acomp.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'bg-white hover:bg-slate-50/70' : 'bg-red-50 text-red-700'}>
                        <td className="p-2 font-semibold text-slate-900">{row.name}</td>
                        <td className="p-2 text-slate-500">{row.email || '—'}</td>
                        <td className="p-2 text-slate-500 font-mono text-[11px]">{row.phone || '—'}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                            {row.category}
                          </span>
                        </td>
                        <td className="p-2 text-slate-500 font-mono text-[11px]">{row.doc || '—'}</td>
                        <td className="p-2 text-slate-500">+{row.companions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              O sistema gerará instantaneamente o <strong>ID do Ingresso, ID do Pedido e QR Code Antifraude</strong> para cada participante.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={previewRows.filter(r => r.isValid).length === 0 || isProcessing}
              onClick={handleExecuteImport}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all ${
                previewRows.filter(r => r.isValid).length > 0 && !isProcessing
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 cursor-pointer active:scale-98'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
              id="btn-confirm-import-guests"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando e Gravando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Importar {previewRows.filter(r => r.isValid).length} Participantes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
