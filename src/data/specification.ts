export interface SpecSection {
  id: string;
  title: string;
  subtitle: string;
  content: string;
}

export const SPECIFICATION_DATA: SpecSection[] = [
  {
    id: 'part1',
    title: 'Parte 1: Resumo Executivo',
    subtitle: 'Visão Geral do Produto e Posicionamento',
    content: `### 1.1 Visão Geral do Produto
O **BP Eventos Check-in & Guest Engine** é uma plataforma web responsiva e PWA de alta performance focada exclusivamente na **gestão inteligente de convidados, distribuição omnicanal de convites (WhatsApp e E-mail) e controle de acesso ultrarrápido por QR Code antifraude**.

Diferente de ticketeiras tradicionais, o sistema **não possui qualquer camada financeira, taxas, vendas públicas, gateways ou split de pagamento**. Sua proposta de valor reside na **eficiência operacional pura para eventos corporativos, convenções, celebrações VIP, listas de relações públicas (PR), casamentos e encontros fechados**.

### 1.2 Principais Benefícios
* **Operação de Portaria em Milissegundos:** Leitura instantânea via câmera web/mobile com resposta visual imediata (Verde = Liberado, Amarelo = Já Utilizado, Vermelho = Inválido).
* **Bloqueio Criptográfico e Antifraude:** QR Codes gerados com tokens únicos não-previsíveis e transação no backend com bloqueio atômico de duplicidade.
* **Distribuição Direta por WhatsApp e E-mail:** Envio automatizado em lote ou assistido por WhatsApp Web/App com links exclusivos e pré-visualização interativa.
* **Editor Visual de Convites:** Customização no-code de templates de convites com branding, instruções, tipografia e posicionamento dinâmico do QR Code.
* **Importação Massiva sem Fricção:** Upload de planilhas CSV/XLSX com mapeamento automático de colunas e detecção prévia de duplicados.
* **Rastreabilidade Total e Auditoria:** Registro de operador, dispositivo, data/hora e IP para cada ação de emissão, envio e leitura.`
  },
  {
    id: 'part2',
    title: 'Parte 2: Lista de Funcionalidades',
    subtitle: 'Priorização por MVP, Versão 2 e Versão 3',
    content: `### 2.1 MVP (Minimum Viable Product - Foco Operacional Imediato)
| Módulo | Funcionalidades Incluídas |
| :--- | :--- |
| **Autenticação & Perfis** | Login e-mail/senha, recuperação, perfis: Administrador, Organizador e Portaria/Operador. |
| **Eventos** | CRUD completo de eventos, datas, capacidade máxima, status (Rascunho, Publicado, Encerrado), capa. |
| **Categorias de Convite** | Criação de lotes/tipos (VIP, Pista, Camarote, Staff, Patrocinador) com cotas e tags coloridas. |
| **Importação em Massa** | Importação CSV/XLSX com preview, validação de e-mails/telefones e mapeamento de campos. |
| **Gestão de Convidados** | Tabela dinâmica, busca em tempo real, filtros por categoria/status, alternador de check-in rápido, detalhes. |
| **QR Code Antifraude** | Token criptográfico seguro por convidado, bloqueio atômico de dupla entrada, histórico de reemissão. |
| **Editor de Convite** | Customizador visual de convite (fundo, logo, cores, instruções, posicionamento do QR) + Página pública individual. |
| **Disparo Omnicanal** | Disparo de convites por E-mail (templates) e WhatsApp (links diretos / envio em lote assistido). |
| **Portaria Mobile PWA** | Leitor de câmera nativo no navegador, suporte a lanterna/câmera frontal/traseira, feedback sonoro e vibração. |
| **Logs & Auditoria** | Registro de data, hora, operador, dispositivo e tentativas de duplicidade barradas. |

### 2.2 Versão 2.0 (Automação e Produtividade Avançada)
* **Check-in Offline / Sync Engine:** Operação local com IndexedDB e sincronização bidirecional em segundo plano quando a conexão oscilar.
* **Integração WhatsApp API Cloud Oficial (Meta Graph):** Disparo automatizado em segundo plano com templates aprovados (HSM) e webhook de leitura.
* **Impressão Instantânea de Etiquetas:** Módulo de impressão automática de crachás térmicos (Zebra / Dymo / Brother) no momento exato do scan.
* **Suporte a Acompanhantes Vinculados:** Check-in individual ou agrupado para titulares e seus dependentes.
* **Controle de Portarias Múltiplas e Zonas:** Restrição de quais ingressos têm permissão em portarias específicas (ex: Portaria VIP vs. Portaria Principal).

### 2.3 Versão 3.0 (Enterprise e Inteligência de Acesso)
* **Reconhecimento Facial Opcional:** Validação de credencial por biometria facial complementar para eventos de alta segurança.
* **Totens de Autoatendimento:** Modo "Kiosk" full-screen para auto-credenciamento do próprio participante.
* **Webhooks & Zapier/Make:** Disparo de eventos de check-in para CRMs corporativos (HubSpot, Salesforce, RD Station).
* **Multi-tenancy White-Label:** Personalização de domínio próprio (cname) e marca completa para agências de eventos.`
  },
  {
    id: 'part3',
    title: 'Parte 3: Arquitetura e Stack Técnica',
    subtitle: 'Topologia Recomendada para Alta Concorrência',
    content: `### 3.1 Stack Tecnológica Recomendada
* **Frontend:** **Next.js (App Router)** ou **React + Vite PWA**, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
* **Backend:** **Next.js Server Actions / API Routes** ou **Node.js (NestJS/Express)** com TypeScript.
* **Banco de Dados Relacional:** **PostgreSQL** (com suporte a transações ACID estritas e isolamento \`SERIALIZABLE\` / \`FOR UPDATE\` para concorrência de check-in).
* **Cache & Lock Distribuído:** **Redis** (para rate limiting, cache dos tokens de check-in da portaria e locks distribuídos por Redlock).
* **Armazenamento de Arquivos:** **AWS S3 / Google Cloud Storage / Cloudflare R2** (para imagens de capa, logos e artes geradas de convites).
* **Provedor de E-mail Transacional:** **Resend / SendGrid / Amazon SES**.
* **Engine de Leitura QR:** BarcodeDetector API nativa com fallback para biblioteca Web Assembly / JSQR.

### 3.2 Topologia de Infraestrutura
\`\`\`
[ Convidado: Mobile Web ] ------> [ CDN / Edge Cache ]
                                           |
[ Portaria: Mobile PWA Scanner ] --------> [ Load Balancer (Nginx / Cloudflare) ]
                                           |
                                [ Node.js App Cluster ]
                                    /       |       \\
                             [ Redis ] [ Postgres ] [ S3 Storage ]
\`\`\``
  },
  {
    id: 'part4',
    title: 'Parte 4: Modelagem de Banco de Dados',
    subtitle: 'Esquema Relacional PostgreSQL Completo',
    content: `### 4.1 Estrutura de Tabelas

#### Tabela: \`organizations\` (Multi-tenancy)
* \`id\` (UUID, PK)
* \`name\` (VARCHAR(150), NOT NULL)
* \`slug\` (VARCHAR(100), UNIQUE, NOT NULL)
* \`created_at\` (TIMESTAMPTZ, DEFAULT NOW())

#### Tabela: \`users\` (Autenticação e Perfis)
* \`id\` (UUID, PK)
* \`org_id\` (UUID, FK -> organizations.id)
* \`name\` (VARCHAR(150), NOT NULL)
* \`email\` (VARCHAR(255), UNIQUE, NOT NULL)
* \`password_hash\` (VARCHAR(255), NOT NULL)
* \`role\` (ENUM: 'admin', 'organizer', 'gate', NOT NULL)
* \`active\` (BOOLEAN, DEFAULT TRUE)
* \`created_at\` (TIMESTAMPTZ, DEFAULT NOW())

#### Tabela: \`events\` (Eventos)
* \`id\` (UUID, PK)
* \`org_id\` (UUID, FK -> organizations.id)
* \`public_code\` (VARCHAR(32), UNIQUE, NOT NULL) -- Ex: BfqSg05OKkK5xSyC4e17
* \`title\` (VARCHAR(200), NOT NULL)
* \`subtitle\` (VARCHAR(255))
* \`description\` (TEXT)
* \`start_date\` (TIMESTAMPTZ, NOT NULL)
* \`end_date\` (TIMESTAMPTZ, NOT NULL)
* \`location_name\` (VARCHAR(200))
* \`address\` (TEXT)
* \`max_capacity\` (INTEGER, DEFAULT 0)
* \`status\` (ENUM: 'draft', 'published', 'closed', DEFAULT 'draft')
* \`cover_url\` (TEXT)
* \`invite_layout_config\` (JSONB)
* \`created_at\` (TIMESTAMPTZ, DEFAULT NOW())

#### Tabela: \`ticket_categories\` (Tipos de Convite)
* \`id\` (UUID, PK)
* \`event_id\` (UUID, FK -> events.id ON DELETE CASCADE)
* \`name\` (VARCHAR(100), NOT NULL) -- Ex: MKT BP, VIP, Pista
* \`color\` (VARCHAR(20), DEFAULT '#2563eb')
* \`quota\` (INTEGER, DEFAULT 0)
* \`access_zone\` (VARCHAR(100))
* \`valid_from\` (TIMESTAMPTZ)
* \`valid_until\` (TIMESTAMPTZ)
* \`created_at\` (TIMESTAMPTZ, DEFAULT NOW())

#### Tabela: \`guests\` (Convidados & Ingressos)
* \`id\` (UUID, PK)
* \`event_id\` (UUID, FK -> events.id ON DELETE CASCADE)
* \`ticket_category_id\` (UUID, FK -> ticket_categories.id)
* \`public_code\` (VARCHAR(32), UNIQUE, NOT NULL) -- Ex: FFa011muQFWRHda5Thxwm
* \`qr_token\` (VARCHAR(64), UNIQUE, NOT NULL) -- Hash seguro não sequencial
* \`qr_version\` (INTEGER, DEFAULT 1)
* \`name\` (VARCHAR(150), NOT NULL)
* \`email\` (VARCHAR(255))
* \`phone\` (VARCHAR(30))
* \`doc_number\` (VARCHAR(30))
* \`companions_count\` (INTEGER, DEFAULT 0)
* \`status\` (ENUM: 'pending', 'sent', 'viewed', 'confirmed', 'cancelled', 'blocked', DEFAULT 'pending')
* \`custom_fields_data\` (JSONB)
* \`notes\` (TEXT)
* \`created_at\` (TIMESTAMPTZ, DEFAULT NOW())

#### Tabela: \`check_ins\` (Registros de Entrada)
* \`id\` (UUID, PK)
* \`guest_id\` (UUID, FK -> guests.id, UNIQUE) -- Garante 1 check-in por convidado a nível de banco
* \`event_id\` (UUID, FK -> events.id)
* \`operator_user_id\` (UUID, FK -> users.id)
* \`operator_name\` (VARCHAR(150))
* \`gate_name\` (VARCHAR(100))
* \`device_info\` (VARCHAR(255))
* \`ip_address\` (VARCHAR(45))
* \`checked_in_at\` (TIMESTAMPTZ, DEFAULT NOW())

#### Tabela: \`audit_logs\` (Histórico & Tentativas Suspeitas)
* \`id\` (UUID, PK)
* \`event_id\` (UUID, FK -> events.id)
* \`guest_id\` (UUID, FK -> guests.id, NULLABLE)
* \`user_id\` (UUID, FK -> users.id, NULLABLE)
* \`action_type\` (VARCHAR(50), NOT NULL) -- Ex: 'CHECKIN_SUCCESS', 'CHECKIN_DUPLICATE_ATTEMPT', 'QR_REISSUED'
* \`severity\` (ENUM: 'info', 'success', 'warning', 'error')
* \`payload\` (JSONB)
* \`created_at\` (TIMESTAMPTZ, DEFAULT NOW())

### 4.2 Índices e Otimizações de Desempenho
* \`CREATE UNIQUE INDEX idx_guests_qr_token ON guests(qr_token);\`
* \`CREATE INDEX idx_guests_event_search ON guests(event_id, name, email, phone);\`
* \`CREATE INDEX idx_checkins_event_time ON check_ins(event_id, checked_in_at);\`
* \`CREATE UNIQUE INDEX idx_single_checkin_per_guest ON check_ins(guest_id);\` -- Proteção em nível de tabela contra duplicidade de concorrência.`
  },
  {
    id: 'part5',
    title: 'Parte 5: Fluxos Operacionais Principais',
    subtitle: 'Diagramas de Sequência e Ciclo de Vida',
    content: `### 5.1 Fluxo de Importação em Massa e Geração de QR Code
1. **Upload:** Organizador arrasta arquivo \`.csv\` ou \`.xlsx\` na interface.
2. **Mapeamento:** Interface cruza colunas automáticas (Nome, E-mail, WhatsApp, Categoria, Documento).
3. **Validação:** Backend valida duplicados internos de telefone/e-mail e formatação.
4. **Persistência & Tokens:** Cada convidado recebe um \`public_code\` e um \`qr_token\` gerado por \`HMAC-SHA256(guest_id + event_id + secret_salt)\`.
5. **Geração dos Convites:** As URLs dos convites ficam prontas instantaneamente: \`https://app.eventiza.com.br/convite/{public_code}\`.

### 5.2 Fluxo de Check-in em Tempo Real e Proteção Antifraude
1. O operador da portaria aponta a câmera para o QR Code do convidado.
2. O leitor PWA decodifica o payload seguro e faz POST imediato para \`/api/v1/checkin/scan\`.
3. **Transação Atômica no Banco de Dados:**
   * Abre transação: \`BEGIN;\`
   * Executa \`SELECT * FROM guests WHERE qr_token = $1 FOR UPDATE;\` (bloqueia o registro contra leituras paralelas simultâneas).
   * Se convidado não existe ou token inválido -> **RETORNA VERMELHO (Inválido)**.
   * Se \`status = 'cancelled'\` ou \`'blocked'\` -> **RETORNA VERMELHO (Bloqueado)**.
   * Se já existe registro em \`check_ins\` ->
     * Grava log em \`audit_logs\` com tipo \`CHECKIN_DUPLICATE_ATTEMPT\` informando operador e hora da tentativa.
     * **RETORNA AMARELO (Duplicado Detectado)** exibindo a hora exata da primeira entrada e quem a validou.
   * Se válido e pendente ->
     * Insere registro em \`check_ins\`.
     * Grava log de auditoria \`CHECKIN_SUCCESS\`.
     * Executa \`COMMIT;\`.
     * **RETORNA VERDE (Entrada Liberada)** tocando som característico de sucesso e exibindo nome e categoria.`
  },
  {
    id: 'part6',
    title: 'Parte 6: Wireframes Textuais das Telas',
    subtitle: 'Estrutura de Componentes e Hierarquia Visual',
    content: `### 6.1 Dashboard Principal do Evento (Conforme Layout Eventiza)
\`\`\`
+-----------------------------------------------------------------------------------------+
| [LOGO BP Eventos]  Evento: MDS|FLC|BP30 (19/08/2026 14:00 - 20:00)   [● Em tempo real] [👤]|
+-----------------------------------------------------------------------------------------+
| [Menu Lateral]  | [BARRA DE PROGRESSO]: Total de check-in efetuados: 2/2 (100%)         |
| • Painel Evento |                                                                       |
| • Participantes | [ CARD 1 ] Ingressos Aprovados: 2                                     |
| • Enviar Convite| [ CARD 2 ] Ingressos Cancelados: 0                                    |
| • Formulário    | [ CARD 3 ] Ingressos Restantes: 98                                    |
| • Editor Convite|                                                                       |
| • Scanner Port. | [ Informações Gerais ]  Situação: Publicado  |  Acessos Rápidos       |
| • Logs/Auditoria|                                                                       |
| • Configurações | [ GRÁFICO 1 ]: Ingressos Cadastrados / Dia   [ GRÁFICO 2 ]: Check-in/H|
+-----------------------------------------------------------------------------------------+
\`\`\`

### 6.2 Lista de Participantes e Check-in Rápido
\`\`\`
+-----------------------------------------------------------------------------------------+
| Lista de Participantes Inscritos       [Buscar...] [Editar Colunas] [Exportar] [+ Novo] |
+-----------------------------------------------------------------------------------------+
| NOME        | ID PEDIDO | ID INGRESSO | CATEGORIA | STATUS     | DATA CHECK-IN | CHECK-IN   |
|-------------+-----------+-------------+-----------+------------+---------------+------------|
| Isabela     | FFa011... | X8odYkf...  | MKT BP    | Confirmado | 15/08 16:34   | [🔵 ON ]   |
| EMERSON     | c35H3L... | 1Yp6Jvu...  | MKT BP    | Confirmado | 15/08 16:31   | [🔵 ON ]   |
| Rodrigo A.  | k9Xw2L... | 88BFA01...  | VIP       | Confirmado | --            | [⚪ OFF]   |
+-----------------------------------------------------------------------------------------+
\`\`\`

### 6.3 Tela Mobile do Scanner de Portaria (PWA)
\`\`\`
+--------------------------------------------------+
| [PORTARIA PRINCIPAL A]        Operador: Marcos   |
|                                                  |
|  +--------------------------------------------+  |
|  |           [ VISOR DA CÂMERA ]              |  |
|  |           (Mira de Enquadramento)          |  |
|  +--------------------------------------------+  |
|  [⚡ Lanterna] [🔄 Alternar Câmera] [🔍 Busca]   |
|                                                  |
|  STATUS DE LEITURA RECENTE:                      |
|  ==============================================  |
|  🟢 [ENTRADA LIBERADA] - Isabela (MKT BP)        |
|     Horário: 16:34 | Operador: Marcos            |
|  ==============================================  |
|  Últimos 5 check-ins da portaria...              |
+--------------------------------------------------+
\`\`\``
  },
  {
    id: 'part7',
    title: 'Parte 7: Regras de Negócio Detalhadas',
    subtitle: 'Políticas de Acesso, Segurança e Validação',
    content: `### 7.1 Regras de Unicidade e Antifraude
* **RN-01 (Imutabilidade do Check-in):** Um QR Code utilizado com sucesso NÃO pode ser reutilizado. Tentativas subsequentes devem disparar alerta amarelo de fraude/duplicidade imediatamente.
* **RN-02 (Concorrência Estrita):** Duas leituras do mesmo QR Code em frações de segundo em portarias diferentes devem ser resolvidas com bloqueio de concorrência (\`pessimistic lock\` / transação SQL isolada). Apenas a primeira leitura é confirmada.
* **RN-03 (Reemissão de QR):** Caso o organizador reemita o QR Code de um convidado (ex: por extravio), a versão do token é incrementada (\`qr_version + 1\`), invalidando automaticamente o QR Code anterior impresso ou baixado.
* **RN-04 (Restrição de Horário por Categoria):** O organizador pode estipular janelas de horário de entrada por categoria (ex: Staff entra a partir das 11:00; Pista somente a partir das 14:00). Se escaneado fora do horário, o sistema sinaliza aviso ao operador.

### 7.2 Regras de Envio por WhatsApp e E-mail
* **RN-05 (Preenchimento de Variáveis):** Mensagens utilizam tags dinâmicas: \`{nome}\`, \`{evento}\`, \`{tipo_ingresso}\`, \`{data}\`, \`{local}\` e \`{link_convite}\`.
* **RN-06 (Fallback WhatsApp):** Quando não houver API oficial configurada, o sistema abre diretamente o WhatsApp Web / App móvel (\`https://wa.me/PHONE?text=ENCODED_MSG\`) com um único clique.`
  },
  {
    id: 'part8',
    title: 'Parte 8: Especificação de APIs REST',
    subtitle: 'Contratos de Endpoints, Payloads e Respostas',
    content: `### 8.1 Autenticação e Portaria

#### \`POST /api/v1/auth/login\`
* **Headers:** \`Content-Type: application/json\`
* **Body:**
\`\`\`json
{
  "email": "portaria1@eventiza.com.br",
  "password": "senhaSegura123"
}
\`\`\`
* **Response 200 OK:**
\`\`\`json
{
  "token": "jwt_token_here",
  "user": {
    "id": "usr_gate1",
    "name": "Marcos Silveira",
    "role": "gate",
    "assignedGate": "Portaria Principal A"
  }
}
\`\`\`

---

#### \`POST /api/v1/events/:eventId/checkin/scan\` (Operação Crítica)
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`
* **Body:**
\`\`\`json
{
  "qrPayload": "EVZ-MDS-BP30-ISABELA-7718A9C2",
  "gateName": "Portaria Principal A",
  "device": "Galaxy S24 Chrome PWA"
}
\`\`\`
* **Response 200 OK (Liberado):**
\`\`\`json
{
  "status": "success",
  "message": "Entrada liberada com sucesso!",
  "guest": {
    "name": "Isabela",
    "category": "MKT BP",
    "publicCode": "FFa011muQFWRHda5Thxwm",
    "doc": "341.***.***-09",
    "companions": 0
  },
  "timestamp": "2026-08-15T16:34:12Z",
  "operator": "Marcos Silveira"
}
\`\`\`
* **Response 409 Conflict (Check-in Já Realizado - Duplicidade):**
\`\`\`json
{
  "status": "duplicate",
  "message": "ATENÇÃO: Este QR Code já foi utilizado anteriormente!",
  "previousCheckIn": {
    "timestamp": "2026-08-15T16:34:12Z",
    "operator": "Marcos Silveira",
    "gate": "Portaria Principal A",
    "device": "Portaria Mobile"
  },
  "guestName": "Isabela"
}
\`\`\`

---

#### \`POST /api/v1/events/:eventId/guests/import\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: multipart/form-data\`
* **Response 201 Created:**
\`\`\`json
{
  "totalProcessed": 150,
  "imported": 148,
  "duplicatesIgnored": 2,
  "batchId": "imp_batch_9921"
}
\`\`\``
  },
  {
    id: 'part9',
    title: 'Parte 9: Plano de Implementação Passo a Passo',
    subtitle: 'Cronograma e Fases de Desenvolvimento',
    content: `### 9.1 Fases do Desenvolvimento
1. **Fase 1 (Fundação & Schema):** Configuração do banco relacional PostgreSQL, índices, modelos e autenticação JWT por perfil (Admin, Organizador, Portaria).
2. **Fase 2 (Módulo de Eventos & Categorias):** CRUD de eventos, definição de cotas de convites e construtor dinâmico de campos adicionais.
3. **Fase 3 (Importador em Massa & Tokenização):** Upload com parser CSV/XLSX, validação de dados e geração de QR Codes com tokens seguros.
4. **Fase 4 (Editor Visual & Disparo de Convites):** Customizador de layout do convite em canvas/HTML, envio de e-mails transacionais e gerador de links para WhatsApp.
5. **Fase 5 (PWA da Portaria & Validação Instantânea):** Scanner por câmera de alta taxa de quadros, sons sintetizados, validação atômica e bloqueio de fraudes.
6. **Fase 6 (Dashboard & Auditoria):** Painel operacional com métricas em tempo real, gráficos de entradas por hora e trilha de auditoria completa.`
  },
  {
    id: 'part10',
    title: 'Parte 10: Sugestão de Prompt Adicional',
    subtitle: 'Prompt Especializado para Geração de Código Full-Stack',
    content: `### 10.1 Prompt Otimizado para Geração de Código
\`\`\`text
Atue como Engenheiro Full Stack especialista em Next.js (App Router), TypeScript, Tailwind CSS e PostgreSQL.

Gere o código completo e executável do sistema BP Eventos Guest & Check-in QR Code, contendo:
1. Backend com rota POST /api/checkin com controle de concorrência estrito usando transação SQL (SELECT FOR UPDATE) para garantir que nenhum QR Code seja lido duas vezes.
2. Interface PWA de Scanner mobile-first com câmera via BarcodeDetector / jsQR, feedback com Web Audio API (som de sucesso e som de erro) e tela colorida de status instantâneo (Verde / Amarelo / Vermelho).
3. Dashboard do organizador completo: barra de progresso de check-in no topo, cards de métricas (Aprovados, Cancelados, Restantes), tabela de convidados com alternador de check-in em tempo real, busca, filtros de categoria e exportação CSV.
4. Editor visual do convite com prévia em tempo real de layout e botão de envio por WhatsApp/E-mail.
5. Sistema de auditoria registrando cada leitura, operador, dispositivo e tentativas duplicadas barradas.

Sem qualquer dependência de módulos de pagamento, checkout ou cobrança. Foque 100% na excelência operacional da portaria e gestão de convidados.
\`\`\``
  }
];
