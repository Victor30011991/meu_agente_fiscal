let db = JSON.parse(localStorage.getItem('fluxopro_db')) || { 
    profile: {nome: '', doc: '', theme: '#2563eb', photo: ''}, 
    entries: [] 
};

let myChart = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initThemeSelector();
    loadProfile();
    renderAll();
    
    // Upload de Foto
    document.getElementById('user-photo-input').onchange = (e) => {
        const reader = new FileReader();
        reader.onload = () => {
            db.profile.photo = reader.result;
            document.getElementById('user-photo-preview').src = reader.result;
            document.getElementById('user-photo-preview').style.display = 'block';
            save();
        };
        reader.readAsDataURL(e.target.files[0]);
    };
});

function loadProfile() {
    document.getElementById('conf-nome').value = db.profile.nome;
    document.getElementById('conf-doc').value = db.profile.doc;
    if(db.profile.photo) {
        document.getElementById('user-photo-preview').src = db.profile.photo;
        document.getElementById('user-photo-preview').style.display = 'block';
    }
    applyTheme(db.profile.theme);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('btn-' + tab).classList.add('active');
    if(tab === 'dash') updateDashboard();
}

function initThemeSelector() {
    const colors = ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#334155'];
    const container = document.getElementById('theme-selector');
    colors.forEach(c => {
        const div = document.createElement('div');
        div.className = 'color-circle';
        div.style.background = c;
        div.onclick = () => { db.profile.theme = c; applyTheme(c); save(); };
        container.appendChild(div);
    });
}

function applyTheme(color) {
    document.documentElement.style.setProperty('--primary', color);
}

function saveConfig() {
    db.profile.nome = document.getElementById('conf-nome').value;
    db.profile.doc = document.getElementById('conf-doc').value;
    save();
    alert("Configurações atualizadas!");
}

function save() {
    localStorage.setItem('fluxopro_db', JSON.stringify(db));
    renderAll();
}

function renderAll() {
    const corpo = document.getElementById('lista-corpo');
    corpo.innerHTML = db.entries.map(e => `
        <tr>
            <td>${e.data}</td>
            <td>${e.tipo}</td>
            <td>${e.categoria}</td>
            <td>R$ ${e.valor.toFixed(2)}</td>
            <td>${e.obs || '-'}</td>
            <td onclick="deleteEntry(${e.id})" style="cursor:pointer">✕</td>
        </tr>
    `).join('');
    updateDashboard();
}

function deleteEntry(id) {
    db.entries = db.entries.filter(x => x.id != id);
    save();
}

function openModal() { document.getElementById('modal-entry').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-entry').style.display = 'none'; }

document.getElementById('form-transacao').onsubmit = (e) => {
    e.preventDefault();
    db.entries.push({
        id: Date.now(),
        data: document.getElementById('f-data').value,
        tipo: document.getElementById('f-tipo').value,
        valor: parseFloat(document.getElementById('f-valor').value),
        categoria: document.getElementById('f-cat').value,
        obs: document.getElementById('f-obs').value
    });
    save(); closeModal();
};

function updateDashboard() {
    const inTotal = db.entries.filter(e => e.tipo === 'Entrada').reduce((a, b) => a + b.valor, 0);
    const outTotal = db.entries.filter(e => e.tipo === 'Saída').reduce((a, b) => a + b.valor, 0);
    document.getElementById('total-entradas').innerText = `R$ ${inTotal.toFixed(2)}`;
    document.getElementById('total-saidas').innerText = `R$ ${outTotal.toFixed(2)}`;
    document.getElementById('total-saldo').innerText = `R$ ${(inTotal - outTotal).toFixed(2)}`;
    
    const ctx = document.getElementById('ctxCategorias').getContext('2d');
    const cats = [...new Set(db.entries.map(e => e.categoria))];
    const vals = cats.map(c => db.entries.filter(x => x.categoria === c).reduce((a,b)=> a+b.valor, 0));

    if(myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: cats, datasets: [{ label: 'R$', data: vals, backgroundColor: db.profile.theme }] }
    });
}
