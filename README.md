# 🚀 FluxoPro Engine v13

Sistema de controle financeiro completo desenvolvido em **HTML + CSS + JavaScript puro**, sem dependências de backend, frameworks ou build tools.

---

## 📦 ESTRUTURA DO PROJETO

```
fluxopro_v13/
├── index.html       ← Dashboard + Lançamentos (arquivo principal)
├── export.html      ← Relatórios (Excel + PDF)
├── import.html      ← Importação (Excel / PDF)
└── themes/
    ├── dark.css
    ├── emerald.css
    ├── gold.css
    ├── indigo.css
    └── rose.css
```

---

## 🆕 NOVIDADES DA V13 (em relação à v12)

### Novas colunas de dados
- ✅ **CPF / CNPJ por lançamento** — cada lançamento pode ter um documento associado
- ✅ **Investimento por lançamento** — campo para registrar valor investido em cada operação

### Formulário rápido inline
- ✅ **"Novo Lançamento" agora é um formulário sempre visível** na sidebar, abaixo do resumo financeiro
- ✅ Não usa mais modal — fluxo mais rápido, sem cliques desnecessários
- ✅ Inclui campos para CPF/CNPJ e Investimento no formulário

### Gráficos aprimorados
- ✅ **4 gráficos** no dashboard (+ gráfico de Investimentos mensais)
- ✅ Gráfico de categorias com filtro de tipo (Entradas ou Saídas)
- ✅ Todos os gráficos cronológicos (ordenados por data)

### Filtros da tabela
- ✅ **Novo filtro por Investimento** (com / sem / todos)
- ✅ Busca agora inclui CPF/CNPJ nos resultados

### Exportação aprimorada
- ✅ **PDF com 4 KPIs** (inclui Investimentos)
- ✅ **Tabela do PDF com colunas CPF/CNPJ e Investimento**
- ✅ **Excel com colunas CPF/CNPJ e Investimento**
- ✅ Rodapé do PDF com número de páginas
- ✅ Filtros disponíveis também na página de relatório

### Configurações reorganizadas
- ✅ Painel de configurações com estatísticas do sistema
- ✅ Backup manual (download/restaurar JSON)
- ✅ Temas e seletor de perfil permanecem no header

### Outras melhorias
- ✅ Tabela ordenada por data (mais recente primeiro)
- ✅ Fonte atualizada: DM Sans + DM Mono (mais legível em tabelas)
- ✅ Chave localStorage atualizada para `fluxopro_v13`
- ✅ Indicador visual de filtro ativo
- ✅ Comentários explicativos em todo o código

---

## 🚀 COMO USAR

### 1. Instalação (use local)
```
fluxopro_v13/
├── index.html
├── export.html
├── import.html
└── themes/    ← Obrigatório: deve estar na mesma pasta
    ├── dark.css
    └── ...
```
Abra o `index.html` no navegador. Funciona 100% offline (após carregamento inicial via CDN).

### 2. Adicionar lançamentos
- Preencha o formulário na sidebar esquerda e clique **💾 Salvar Lançamento**
- Campos: Data, Tipo, Categoria, Valor, CPF/CNPJ, Investimento, Observação

### 3. Editar lançamentos
- Clique em qualquer célula da tabela para editar inline
- Clique no badge **Entrada/Saída** para alternar o tipo
- Clique no 🗑️ para apagar

### 4. Importar dados
- Clique **📥 Importar** ou **📥 Alimentar perfil**
- Suporta Excel (.xlsx/.xls) e PDF (extratos FluxoPro ou genéricos)
- **Colunas Excel aceitas:** Data | Categoria | Tipo | Valor | Observação | Investimento | CPF_CNPJ
- Colunas `Investimento` e `CPF_CNPJ` são opcionais

### 5. Exportar relatório
- Clique **📊 Exportar** ou **Gerar Relatório**
- Escolha **Excel** ou **PDF**
- O PDF inclui: capa com nome, KPIs, gráficos, tabela com CPF/CNPJ e Investimento

---

## 📊 ESTRUTURA DE DADOS (localStorage)

```javascript
// Chave: "fluxopro_v13"
{
  active: "default",
  profiles: {
    default: [
      {
        id:    "uuid",
        data:  "2025-01-15",      // YYYY-MM-DD
        cat:   "Salário",
        tipo:  "Entrada",         // "Entrada" ou "Saída"
        valor: 5000,
        inv:   500,               // Valor investido (novo na v13)
        doc:   "123.456.789-00",  // CPF/CNPJ do lançamento (novo na v13)
        obs:   "Janeiro"
      }
    ]
  },
  profileInfo: {
    default: {
      nome: "João Silva",
      doc:  "123.456.789-00"     // CPF/CNPJ do perfil
    }
  },
  theme: "dark"
}
```

---

## 🔄 MIGRAÇÃO DA V12 PARA V13

Os dados da v12 ficam em `fluxopro_v12` no localStorage.
Para migrar, execute no console do navegador (F12):

```javascript
const old = localStorage.getItem("fluxopro_v12");
if (old) {
  const db = JSON.parse(old);
  // Adiciona campos novos com valores padrão nos lançamentos existentes
  Object.values(db.profiles).forEach(arr => {
    arr.forEach(l => {
      if (!l.inv) l.inv = 0;
      if (!l.doc) l.doc = "";
    });
  });
  localStorage.setItem("fluxopro_v13", JSON.stringify(db));
  alert("✅ Dados migrados para v13!");
  location.reload();
}
```

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

Acessíveis pela aba **Configurações** no header:
- **Backup JSON** — baixar todos os dados como arquivo
- **Restaurar backup** — carregar de arquivo .json
- **Reset de fábrica** — apaga tudo (confirmação dupla)

---

## 🛠️ REQUISITOS TÉCNICOS

**Navegadores:** Chrome 90+ | Firefox 88+ | Edge 90+ | Safari 14+ | Opera 76+

**Dependências via CDN:**
| Biblioteca | Uso |
|---|---|
| Chart.js 4.4 | Gráficos |
| SheetJS 0.18.5 | Import/Export Excel |
| jsPDF 2.5.1 | Geração de PDF |
| PDF.js 3.11.174 | Leitura de PDFs |
| Google Fonts (DM Sans + DM Mono) | Tipografia |

---

## 🔒 PRIVACIDADE

- ✅ Todos os dados ficam **no seu navegador** (localStorage)
- ✅ Nenhum dado é enviado para servidores externos
- ✅ Funciona offline após o primeiro carregamento

---

**FluxoPro Engine v13** — Fevereiro 2026
