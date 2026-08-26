import React from 'react';
import { FormField } from '../types';
import { 
  FileText, 
  Plus, 
  GripVertical, 
  Edit3, 
  Trash2, 
  Check, 
  Save, 
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface FormBuilderViewProps {
  fields: FormField[];
  onSaveFields: (fields: FormField[]) => void;
}

export const FormBuilderView: React.FC<FormBuilderViewProps> = ({
  fields: initialFields,
  onSaveFields,
}) => {
  const [fields, setFields] = React.useState<FormField[]>(initialFields);
  const [replicateData, setReplicateData] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleToggleRequired = (fieldId: string) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, required: !f.required } : f));
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  const handleAddField = (label: string, type: any, isCustom: boolean = true, isInternal: boolean = false) => {
    const newField: FormField = {
      id: `fld_${Date.now()}`,
      label,
      name: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      type,
      required: false,
      isCustom,
      isInternal,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const handleSave = () => {
    onSaveFields(fields);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header matching screenshot 2 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Campos do formulário de inscrição</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure quais informações serão solicitadas aos participantes ou preenchidas pela equipe
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Salvo!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Formulário</span>
            </>
          )}
        </button>
      </div>

      {/* Palette of Addable Field Chips (matching screenshot 2) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
        {/* Row 1: Campos Genéricos */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Campos Genéricos
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'NOME COMPLETO',
              'E-MAIL',
              'DATA DE NASCIMENTO',
              'CPF / CNPJ',
              'TELEFONE / CELULAR',
              'GÊNERO',
              'CIDADE E ESTADO',
              'ESTADO',
            ].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleAddField(name, 'text', false, false)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-full font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Campos Customizáveis & Internos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Campos Customizáveis
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'TEXTO', type: 'text' },
                { label: 'LISTA DE OPÇÕES', type: 'select' },
                { label: 'MÚLTIPLAS SELEÇÕES', type: 'select' },
                { label: 'TERMOS E CONDIÇÕES', type: 'terms' },
                { label: 'ARQUIVO', type: 'file' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleAddField(item.label, item.type, true, false)}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <span>Campos Internos (Exclusivo do Organizador)</span>
              <HelpCircle className="w-3 h-3 text-slate-400" />
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'TEXTO LIVRE', type: 'text' },
                { label: 'VERIFICAÇÃO', type: 'terms' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleAddField(item.label, item.type, true, true)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-full font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preenchimento Simplificado Toggle (matching screenshot 2) */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReplicateData(!replicateData)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              replicateData ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                replicateData ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="text-xs text-slate-700 font-medium">
            <strong>PREENCHIMENTO SIMPLIFICADO:</strong> Permitir preencher os dados somente uma vez e replicar para todos os ingressos
          </div>
        </div>
      </div>

      {/* Fields Table (matching screenshot 2) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-12 text-center">Ordenar</th>
              <th className="py-3 px-4">Nome do Campo</th>
              <th className="py-3 px-4">Tipo do Campo</th>
              <th className="py-3 px-4 text-center">Preenchimento Obrigatório</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {fields.map((field) => (
              <tr key={field.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4 text-center text-slate-400 cursor-grab">
                  <GripVertical className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span>{field.label}</span>
                    {field.isInternal && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold text-[9px] border border-purple-200">
                        Interno
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                  {field.type}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleRequired(field.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      field.required ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        field.required ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button className="p-1 text-slate-400 hover:text-blue-600 rounded">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
