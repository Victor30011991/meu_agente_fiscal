// Configuração Inicial e Agente de Dados
let state = JSON.parse(localStorage.getItem('sgf_data')) || {
    profile: { type: 'PF', name: '', id: '', logo: '' },
    entries: []
};

const LIMITE_MEI = 81000.00;

function saveState() {
    localStorage.setItem('sgf_data', JSON.stringify(state));
    renderDash();
}

// Agente Fiscal - Cálculo de Limite MEI
function calculateMeiStatus() {
    const currentYear = new Date().getFullYear();
    const faturamentoAnual = state.entries
        .filter(e => e.type === 'Entrada' && e.destinacao === 'Empresarial' && new Date(e.date).getFullYear() === currentYear)
        .reduce((sum, e) => sum + parseFloat(e.value), 0);

    const percent = (faturamentoAnual / LIMITE_MEI) * 100;
    const restante = LIMITE_MEI - faturamentoAnual;

    return { faturamentoAnual, percent, restante };
}

// Agente UX - Alternar Abas
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

// Agente Financeiro - Renderizar Dashboard
function renderDash() {
    const mei = calculateMeiStatus();
    const alertBox = document.getElementById('mei-alert');
    
    if (state.profile.type === 'MEI') {
        alertBox.style.display = 'block';
        document.getElementById('mei-percent').innerText = `${mei.percent.toFixed(2)}% (Restam R$ ${mei.restante.toFixed(2)})`;
        if (mei.percent > 80) alertBox.style.color = 'red';
    } else {
        alertBox.style.display = 'none';
    }
}

// Agente de Exportação - Excel
function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(state.entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lancamentos");
    XLSX.writeFile(wb, "Relatorio_Financeiro.xlsx");
}

// Inicialização
renderDash();
