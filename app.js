// Banco de Dados Centralizado
let db = JSON.parse(localStorage.getItem('fluxopro_final')) || {
    config: { user: '', doc: '', meiLimit: 81000 },
    entries: []
};

// Motores de Dashboards Independentes
const charts = { geral: null, mei: null, despesas: null };

function updateDashboards() {
    // DASHBOARD 1: GERAL (Entradas vs Saídas)
    const inSum = db.entries.filter(e => e.tipo === 'Entrada').reduce((a, b) => a + b.valor, 0);
    const outSum = db.entries.filter(e => e.tipo === 'Saída').reduce((a, b) => a + b.valor, 0);
    
    renderChart('chartGeral', 'pie', ['Entradas', 'Saídas'], [inSum, outSum], 'geral');

    // DASHBOARD 2: FISCAL MEI
    const faturamentoEmp = db.entries.filter(e => e.dest === 'Empresa' && e.tipo === 'Entrada').reduce((a, b) => a + b.valor, 0);
    const restante = Math.max(0, db.config.meiLimit - faturamentoEmp);
    renderChart('chartMei', 'doughnut', ['Faturado', 'Disponível'], [faturamentoEmp, restante], 'mei');
    
    if (faturamentoEmp > db.config.meiLimit * 0.8) {
        document.getElementById('mei-alert').innerHTML = `<p style="color:red">⚠️ Atenção: 80% do limite MEI atingido!</p>`;
    }

    // DASHBOARD 3: ANÁLISE CATEGORIAS
    const cats = [...new Set(db.entries.map(e => e.categoria))];
    const catVals = cats.map(c => db.entries.filter(e => e.categoria === c).reduce((a,b) => a + b.valor, 0));
    renderChart('chartDespesas', 'bar', cats, catVals, 'despesas');
}

function renderChart(id, type, labels, data, key) {
    const ctx = document.getElementById(id).getContext('2d');
    if (charts[key]) charts[key].destroy();
    charts[key] = new Chart(ctx, {
        type: type,
        data: { labels, datasets: [{ data, backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// TELA DE PRÉ-VISUALIZAÇÃO E EXPORTAÇÃO REAL
function openExportModal() { document.getElementById('modal-export').style.display = 'flex'; }

async function processExport(format) {
    const filtro = document.getElementById('exp-filtro').value;
    const filtrados = filtro === 'todos' ? db.entries : db.entries.filter(e => e.dest === filtro);

    if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // CAPA E DESIGN
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255);
        doc.text("RELATÓRIO FINANCEIRO - FLUXOPRO", 14, 25);
        
        // DASHBOARD DO RELATÓRIO (RESUMO)
        doc.setTextColor(0);
        doc.text("Página 1: Resumo do Período", 14, 50);
        doc.text(`Total Registros: ${filtrados.length}`, 14, 60);
        
        // TABELA FORMATADA
        const body = filtrados.map(e => [e.data, e.dest, e.categoria, `R$ ${e.valor.toFixed(2)}`]);
        doc.autoTable({ head: [['Data', 'Destino', 'Categoria', 'Valor']], body, startY: 70 });
        
        doc.save(`Relatorio_${filtro}.pdf`);
    } else {
        // EXCEL FORMATADO
        const ws = XLSX.utils.json_to_sheet(filtrados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dados");
        XLSX.writeFile(wb, "FluxoPro_Export.xlsx");
    }
    closeModal('modal-export');
}
