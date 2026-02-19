# 🚀 FluxoPro Engine v12

Sistema de controle financeiro completo desenvolvido em **HTML + CSS + JavaScript puro**, sem dependências de backend, frameworks ou build.

---

## 📦 ARQUIVOS DO PROJETO

```
fluxopro_v12/
├── index.html           # Arquivo principal (dashboard + lançamentos)
├── export.html          # Tela de relatórios (Excel e PDF)
├── import.html          # Tela de importação de Excel
├── themes/              # Pasta de temas
│   ├── dark.css
│   ├── emerald.css
│   ├── gold.css
│   ├── indigo.css
│   └── rose.css
├── CHANGELOG.md         # Lista de mudanças da v11 → v12
├── PLANO_DE_TESTES.md   # Roteiro de testes manuais
└── README.md            # Este arquivo
```

---

## 🎯 RECURSOS

### ✅ Funcionalidades Principais
- ✅ Múltiplos perfis financeiros
- ✅ Lançamentos de entrada e saída
- ✅ Dashboard com 3 gráficos interativos
- ✅ Edição inline (contenteditable)
- ✅ Importação de Excel (.xlsx, .xls)
- ✅ Exportação para Excel e PDF
- ✅ 6 temas visuais
- ✅ Dados salvos no localStorage
- ✅ Sistema de validações robusto

### 🎨 Temas Disponíveis
1. **Padrão** - Azul e branco (clean)
2. **Dark** - Modo escuro
3. **Emerald** - Verde profissional
4. **Gold** - Dourado elegante
5. **Indigo** - Roxo moderno
6. **Rose** - Rosa suave

---

## 🚀 INSTALAÇÃO

### Opção 1: Uso Local (Recomendado)
1. Baixe todos os arquivos
2. Mantenha a estrutura de pastas:
   ```
   sua_pasta/
   ├── index.html
   ├── export.html
   ├── import.html
   └── themes/
       ├── dark.css
       ├── emerald.css
       └── ...
   ```
3. Abra `index.html` no navegador

**Pronto!** O sistema funciona 100% offline.

---

### Opção 2: Servidor Local (Opcional)
Se preferir usar um servidor local:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Acesse: `http://localhost:8000`

---

## 📖 COMO USAR

### 1️⃣ Primeiro Acesso
1. Abra `index.html`
2. O sistema cria automaticamente o perfil "default"
3. Preencha Nome e CPF/CNPJ (opcional)

---

### 2️⃣ Adicionar Lançamentos

#### Manualmente:
1. Clique em **"➕ Novo lançamento"**
2. Preencha:
   - Data
   - Categoria (ex: Salário, Aluguel, Alimentação)
   - Tipo (Entrada ou Saída)
   - Valor (ex: 1500 ou 1.500,00)
   - Observação (opcional)
3. Clique **"💾 Salvar"**

#### Via Importação:
1. Prepare um Excel com as colunas:
   ```
   Data | Categoria | Tipo | Valor | Observação
   ```
2. Clique **"📥 Alimentar perfil"**
3. Selecione o arquivo
4. Revise a prévia
5. Confirme a importação

---

### 3️⃣ Editar Lançamentos
- Clique em qualquer campo da tabela para editar
- Clique no badge de tipo para alternar Entrada/Saída
- Clique no 🗑️ para apagar

---

### 4️⃣ Trocar Tema
- Clique nas bolinhas coloridas no header
- O tema é salvo automaticamente

---

### 5️⃣ Exportar Relatórios
1. Clique **"📊 Exportar"**
2. Escolha:
   - **Excel** - Para editar ou importar depois
   - **PDF** - Para imprimir ou compartilhar

---

### 6️⃣ Múltiplos Perfis
- Clique no **"+"** ao lado do seletor de perfis
- Digite o nome (ex: "Empresa", "Pessoal", "Investimentos")
- Cada perfil tem dados isolados

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### Reset de Fábrica
1. Vá em **"Configurações"**
2. Clique **"🗑️ Reset de fábrica"**
3. Confirme **2 vezes**
4. ⚠️ **ATENÇÃO:** Isso apaga TODOS os dados

---

### Migração da v11 para v12
Se você já usava a versão 11, execute no console do navegador:

```javascript
const old = localStorage.getItem("fluxopro_v11");
if(old){
  const db = JSON.parse(old);
  db.theme = "";
  localStorage.setItem("fluxopro_v12", JSON.stringify(db));
  alert("✅ Dados migrados para v12");
  location.reload();
}
```

---

## 🛠️ REQUISITOS TÉCNICOS

### Navegadores Compatíveis:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ✅ Opera 76+

### Dependências Externas (via CDN):
- **Chart.js** - Gráficos
- **SheetJS (XLSX)** - Importação/exportação de Excel
- **jsPDF** - Geração de PDF
- **Google Fonts (Inter)** - Tipografia

---

## 📊 ESTRUTURA DE DADOS

### localStorage:
```javascript
{
  "fluxopro_v12": {
    active: "default",           // Perfil ativo
    profiles: {
      default: [
        {
          id: "uuid",
          data: "2024-01-15",
          cat: "Salário",
          tipo: "Entrada",
          valor: 5000,
          obs: "Janeiro"
        }
      ]
    },
    profileInfo: {
      default: {
        nome: "João Silva",
        doc: "123.456.789-00"
      }
    },
    theme: "dark"               // Tema selecionado
  }
}
```

---

## 🔒 SEGURANÇA E PRIVACIDADE

- ✅ Todos os dados ficam **no seu navegador** (localStorage)
- ✅ **Nenhum dado é enviado para servidores externos**
- ✅ Funciona 100% offline (após carregar CDNs)
- ✅ Você tem controle total dos seus dados

### Backup Manual:
Para fazer backup, execute no console:
```javascript
const backup = localStorage.getItem("fluxopro_v12");
console.log(backup);
// Copie o texto e salve em arquivo .txt
```

Para restaurar:
```javascript
const backup = '... cole aqui o texto do backup ...';
localStorage.setItem("fluxopro_v12", backup);
location.reload();
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### Problema: Temas não funcionam
**Solução:** Verifique se a pasta `themes/` está na mesma pasta do `index.html`

---

### Problema: Importação não funciona
**Solução:** 
1. Verifique o formato do Excel:
   - Colunas exatas: Data | Categoria | Tipo | Valor | Observação
   - Tipo deve ser "Entrada" ou "Saída"
   - Valor deve ser numérico

---

### Problema: Gráficos não aparecem
**Solução:**
1. Adicione pelo menos 1 lançamento
2. Verifique conexão com internet (Chart.js via CDN)
3. Clique no botão "🔄 Refresh"

---

### Problema: Dados sumiram
**Solução:**
1. Verifique se não trocou de navegador ou modo anônimo
2. localStorage é isolado por navegador
3. Não use modo anônimo para dados permanentes

---

## 📞 SUPORTE

- 📖 Leia o **CHANGELOG.md** para ver todas as mudanças
- 🧪 Consulte o **PLANO_DE_TESTES.md** para validar o sistema
- 💬 Problemas? Abra uma issue no repositório

---

## 📜 LICENÇA

Este projeto é open-source e livre para uso pessoal e comercial.

---

## 👨‍💻 CRÉDITOS

**Desenvolvido por:** Equipe FluxoPro Engine  
**Versão:** 12.0.0  
**Data:** Fevereiro 2026

---

## 🎯 ROADMAP (Futuro)

- [ ] Filtros por data/categoria
- [ ] Busca de lançamentos
- [ ] Gráfico de evolução mensal
- [ ] Backup automático em nuvem (Google Drive)
- [ ] App mobile (PWA)
- [ ] Categorias customizáveis
- [ ] Múltiplos usuários com login

---

**Aproveite o FluxoPro Engine v12!** 🚀
