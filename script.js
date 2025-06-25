document.addEventListener('DOMContentLoaded', function() {
    // --- Elementos Comuns ---
    const setupPage = document.getElementById('setup-page');
    const trackingPage = document.getElementById('tracking-page');
    const exportarExcelBtn = document.getElementById('exportarExcelBtn');

    // --- Elementos da Página de Configuração (Setup) ---
    const novaCategoriaNomeInput = document.getElementById('novaCategoriaNome');
    const novaCategoriaOrcamentoInput = document.getElementById('novaCategoriaOrcamento');
    const addCategoriaBtn = document.getElementById('addCategoriaBtn');
    const tabelaSetupCategoriasBody = document.querySelector('#tabelaSetupCategorias tbody');
    const salvarConfigBtn = document.getElementById('salvarConfigBtn');
    const resetConfigBtn = document.getElementById('resetConfigBtn');

    // --- Elementos da Página de Rastreamento (Tracking) ---
    const alterarConfigBtn = document.getElementById('alterarConfigBtn');
    const valorGastoInput = document.getElementById('valorGasto');
    const trackingCategoriasContainer = document.getElementById('trackingCategoriasContainer'); // Container para os botões de categoria
    const adicionarBtn = document.getElementById('adicionarBtn');
    const listaGastosDiv = document.getElementById('listaGastos');
    const tabelaResumoBody = document.querySelector('#tabelaResumo tbody');
    const previsaoGastosTotalSpan = document.getElementById('previsaoGastosTotal');
    const jaGastosTotalSpan = document.getElementById('jaGastosTotal');
    const saldoTotalSpan = document.getElementById('saldoTotal');

    // --- Variáveis de Estado ---
    let userConfig = {
        categoriasComOrcamento: [] // Array de objetos { name: 'categoria', budget: 1000 }
    };
    let gastos = []; // Armazena os gastos individuais adicionados

    // --- Funções de LocalStorage ---
    function loadUserConfig() {
        const savedConfig = localStorage.getItem('userExpenseTrackerConfig');
        if (savedConfig) {
            userConfig = JSON.parse(savedConfig);
        }
        console.log('Configuração do usuário carregada:', userConfig);
    }

    function saveUserConfig() {
        localStorage.setItem('userExpenseTrackerConfig', JSON.stringify(userConfig));
        console.log('Configuração do usuário salva:', userConfig);
    }

    function carregarGastos() {
        const gastosSalvos = localStorage.getItem('gastosDiarios');
        if (gastosSalvos) {
            gastos = JSON.parse(gastosSalvos);
        }
        console.log('Gastos individuais carregados:', gastos);
    }

    function salvarGastos() {
        localStorage.setItem('gastosDiarios', JSON.stringify(gastos));
        console.log('Gastos individuais salvos:', gastos);
    }

    // --- Funções de Navegação entre Páginas ---
    function showPage(pageId) {
        setupPage.classList.add('hidden');
        trackingPage.classList.add('hidden');
        document.getElementById(pageId).classList.remove('hidden');
        console.log(`Exibindo página: ${pageId}`);
    }

    // --- Funções da Página de Configuração (Setup Page) ---
    function renderSetupCategories() {
        tabelaSetupCategoriasBody.innerHTML = '';
        if (userConfig.categoriasComOrcamento.length === 0) {
            tabelaSetupCategoriasBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhuma categoria adicionada ainda.</td></tr>';
        }

        userConfig.categoriasComOrcamento.forEach((cat, index) => {
            const row = tabelaSetupCategoriasBody.insertRow();
            row.innerHTML = `
                <td>${cat.name}</td>
                <td style="text-align: right;">R$ ${cat.budget.toFixed(2).replace('.', ',')}</td>
                <td class="setup-table-actions">
                    <button class="edit-category-btn" data-index="${index}">Editar</button>
                    <button class="remove-category-btn" data-index="${index}">Remover</button>
                </td>
            `;
        });

        // Adiciona event listeners para botões de edição e remoção na tabela de setup
        document.querySelectorAll('.remove-category-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                userConfig.categoriasComOrcamento.splice(index, 1);
                saveUserConfig();
                renderSetupCategories(); // Renderiza novamente a tabela de setup
                // Opcional: remover gastos associados a essa categoria se ela for excluída? Por simplicidade, vamos deixar para o reset total ou o usuário se vira.
            });
        });

        document.querySelectorAll('.edit-category-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const currentCategory = userConfig.categoriasComOrcamento[index];
                const newName = prompt(`Editar nome para "${currentCategory.name}":`, currentCategory.name);
                if (newName !== null && newName.trim() !== '') {
                    const newBudget = parseFloat(prompt(`Editar orçamento para "${currentCategory.name}" (R$):`, currentCategory.budget.toFixed(2)));
                    if (!isNaN(newBudget) && newBudget >= 0) {
                        userConfig.categoriasComOrcamento[index] = { name: newName.trim(), budget: newBudget };
                        saveUserConfig();
                        renderSetupCategories();
                    } else {
                        alert('Orçamento inválido.');
                    }
                }
            });
        });
    }

    addCategoriaBtn.addEventListener('click', function() {
        const name = novaCategoriaNomeInput.value.trim();
        const budget = parseFloat(novaCategoriaOrcamentoInput.value);

        if (name && !isNaN(budget) && budget >= 0) {
            // Verifica se a categoria já existe
            if (userConfig.categoriasComOrcamento.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
                alert('Esta categoria já existe. Por favor, escolha um nome diferente ou edite a existente.');
                return;
            }

            userConfig.categoriasComOrcamento.push({ name: name, budget: budget });
            saveUserConfig();
            renderSetupCategories();
            novaCategoriaNomeInput.value = '';
            novaCategoriaOrcamentoInput.value = '';
        } else {
            alert('Por favor, preencha um nome de categoria e um orçamento válido.');
        }
    });

    salvarConfigBtn.addEventListener('click', function() {
        if (userConfig.categoriasComOrcamento.length === 0) {
            alert('Por favor, adicione pelo menos uma categoria antes de salvar.');
            return;
        }
        showPage('tracking-page');
        initializeTrackingPage(); // Inicializa a página de rastreamento com a nova configuração
    });

    resetConfigBtn.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja resetar TODAS as configurações e gastos? Esta ação é irreversível.')) {
            localStorage.removeItem('userExpenseTrackerConfig');
            localStorage.removeItem('gastosDiarios');
            userConfig.categoriasComOrcamento = [];
            gastos = [];
            renderSetupCategories();
            showPage('setup-page'); // Volta para a página de configuração
            alert('Configurações e gastos foram resetados.');
        }
    });

    // --- Funções da Página de Rastreamento (Tracking Page) ---
    function initializeTrackingPage() {
        // Gera os botões de categoria dinamicamente
        trackingCategoriasContainer.innerHTML = '<p>Selecione a Categoria:</p>'; // Limpa e adiciona o título
        userConfig.categoriasComOrcamento.forEach(cat => {
            const button = document.createElement('button');
            button.className = 'btn-categoria';
            button.dataset.categoria = cat.name; // Usa o nome da categoria como data-categoria
            button.textContent = cat.name;
            trackingCategoriasContainer.appendChild(button);
        });

        // Adiciona event listeners para os novos botões de categoria
        document.querySelectorAll('#trackingCategoriasContainer .btn-categoria').forEach(botao => {
            botao.addEventListener('click', function() {
                document.querySelectorAll('#trackingCategoriasContainer .btn-categoria').forEach(btn => btn.classList.remove('selecionado'));
                this.classList.add('selecionado');
                categoriaSelecionada = this.dataset.categoria;
                console.log('Categoria selecionada para gasto:', categoriaSelecionada);
            });
        });

        // Atualiza as exibições com base na configuração e gastos atuais
        atualizarListaGastos();
        atualizarTabelaResumo();
        atualizarTotaisGerais();
    }

    adicionarBtn.addEventListener('click', function() {
        const valorGasto = parseFloat(valorGastoInput.value);
        if (valorGasto > 0 && categoriaSelecionada) {
            const novoGasto = { 
                id: Date.now(), 
                categoria: categoriaSelecionada, 
                valor: valorGasto 
            };
            gastos.push(novoGasto);
            salvarGastos();
            
            atualizarListaGastos();
            atualizarTabelaResumo();
            atualizarTotaisGerais();
            
            valorGastoInput.value = '';
            categoriaSelecionada = '';
            document.querySelectorAll('#trackingCategoriasContainer .btn-categoria').forEach(btn => btn.classList.remove('selecionado'));
            console.log('Gasto adicionado:', novoGasto);
        } else {
            alert('Por favor, insira um valor válido e selecione uma categoria.');
        }
    });

    function atualizarListaGastos() {
        listaGastosDiv.innerHTML = '';
        if (gastos.length === 0) {
            listaGastosDiv.textContent = 'Nenhum gasto adicionado ainda.';
            return;
        }
        gastos.forEach((gasto) => {
            const gastoItem = document.createElement('div');
            gastoItem.className = 'gasto-item';
            gastoItem.innerHTML = `
                <span>${gasto.categoria}: R$ ${gasto.valor.toFixed(2).replace('.', ',')}</span>
                <button class="btn-remover" data-id="${gasto.id}">Remover</button>
            `;
            listaGastosDiv.appendChild(gastoItem);
        });

        document.querySelectorAll('.btn-remover').forEach(botaoRemover => {
            botaoRemover.addEventListener('click', function() {
                const idParaRemover = parseInt(this.dataset.id);
                console.log('Botão Remover clicado para o ID:', idParaRemover);
                removerGastoIndividual(idParaRemover);
            });
        });
    }

    function removerGastoIndividual(id) {
        gastos = gastos.filter(gasto => gasto.id !== id);
        salvarGastos();
        
        atualizarListaGastos();
        atualizarTabelaResumo();
        atualizarTotaisGerais();
        console.log('Gasto removido e interface atualizada.');
    }

    function atualizarTabelaResumo() {
        tabelaResumoBody.innerHTML = '';

        let totaisPorCategoria = {};
        // Inicializa totais por categoria com 0 usando as categorias do usuário
        userConfig.categoriasComOrcamento.forEach(cat => {
            totaisPorCategoria[cat.name] = 0;
        });

        gastos.forEach(gasto => {
            // Garante que o gasto está em uma categoria existente
            if (totaisPorCategoria.hasOwnProperty(gasto.categoria)) {
                totaisPorCategoria[gasto.categoria] += gasto.valor;
            } else {
                // Se o gasto for de uma categoria que foi removida da configuração, ele será ignorado ou pode ser atribuído a 'Outros' se essa for uma categoria default
                console.warn(`Gasto em categoria '${gasto.categoria}' não encontrada na configuração atual. Ignorando este gasto no resumo.`);
                // Opcional: Se 'Outros' é uma categoria dinâmica, adicione o gasto lá.
                // Se userConfig.categoriasComOrcamento inclui 'Outros', pode-se adicionar:
                // if (totaisPorCategoria.hasOwnProperty('Outros')) { totaisPorCategoria['Outros'] += gasto.valor; }
            }
        });

        userConfig.categoriasComOrcamento.forEach(cat => {
            const orcamento = cat.budget;
            const jaGastei = totaisPorCategoria[cat.name] || 0;
            const saldo = orcamento - jaGastei;

            const row = tabelaResumoBody.insertRow();
            row.innerHTML = `
                <td>${cat.name}</td>
                <td style="text-align: right;">R$ ${orcamento.toFixed(2).replace('.', ',')}</td>
                <td style="text-align: right; background-color: #D9EDC8;">R$ ${saldo.toFixed(2).replace('.', ',')}</td>
                <td style="text-align: right; background-color: #FEEFB3;">R$ ${jaGastei.toFixed(2).replace('.', ',')}</td>
            `;
        });
        console.log('Tabela de resumo atualizada.');
    }

    function atualizarTotaisGerais() {
        let previsaoTotal = 0;
        userConfig.categoriasComOrcamento.forEach(cat => {
            previsaoTotal += cat.budget;
        });

        let jaGastosTotal = 0;
        gastos.forEach(gasto => {
            jaGastosTotal += gasto.valor;
        });

        const saldoTotal = previsaoTotal - jaGastosTotal;

        previsaoGastosTotalSpan.textContent = `R$ ${previsaoTotal.toFixed(2).replace('.', ',')}`;
        jaGastosTotalSpan.textContent = `R$ ${jaGastosTotal.toFixed(2).replace('.', ',')}`;
        saldoTotalSpan.textContent = `R$ ${saldoTotal.toFixed(2).replace('.', ',')}`;
        console.log('Totais gerais atualizados:', { previsaoTotal, jaGastosTotal, saldoTotal });
    }

    alterarConfigBtn.addEventListener('click', function() {
        if (confirm('Ao alterar a configuração, você voltará para a tela inicial. Todos os gastos existentes serão mantidos, mas podem precisar ser reavaliados se as categorias mudarem. Deseja continuar?')) {
            showPage('setup-page');
            renderSetupCategories(); // Garante que a tabela de setup esteja atualizada ao voltar
        }
    });

    // --- Função de Exportação para Excel ---
    exportarExcelBtn.addEventListener('click', function() {
        console.log('Botão Exportar para Excel clicado.');
        const dadosParaPlanilha = [];

        // Linha 1: Título "CONTROLE DE GASTOS" (mesclado B1:D1)
        dadosParaPlanilha.push(["", "CONTROLE DE GASTOS", "", ""]); 
        // Linha 2: Cabeçalhos
        dadosParaPlanilha.push(["ITEM", "VALOR", "SALDO", "JA GASTEI"]);

        // Dados das categorias (calculados)
        let totaisPorCategoria = {};
        userConfig.categoriasComOrcamento.forEach(cat => {
            totaisPorCategoria[cat.name] = 0;
        });

        gastos.forEach(gasto => {
            if (totaisPorCategoria.hasOwnProperty(gasto.categoria)) {
                totaisPorCategoria[gasto.categoria] += gasto.valor;
            }
        });

        userConfig.categoriasComOrcamento.forEach(cat => {
            const orcamento = cat.budget;
            const jaGastei = totaisPorCategoria[cat.name] || 0;
            const saldo = orcamento - jaGastei;
            dadosParaPlanilha.push([
                cat.name,
                orcamento,
                saldo,
                jaGastei
            ]);
        });

        // Linha vazia para espaçamento
        dadosParaPlanilha.push([]);

        // Totais Finais (obtidos do HTML para garantir consistência)
        const previsaoTotal = parseFloat(previsaoGastosTotalSpan.textContent.replace('R$ ', '').replace(',', '.'));
        const jaGastosTotal = parseFloat(jaGastosTotalSpan.textContent.replace('R$ ', '').replace(',', '.'));
        const saldoGeral = parseFloat(saldoTotalSpan.textContent.replace('R$ ', '').replace(',', '.'));

        dadosParaPlanilha.push(["PREVISAO DE GASTOS", "", previsaoTotal, ""]);
        dadosParaPlanilha.push(["JA GASTOS", jaGastosTotal, "", ""]);
        dadosParaPlanilha.push(["SALDO", saldoGeral, "", ""]);

        // Cria a planilha
        const ws = XLSX.utils.aoa_to_sheet(dadosParaPlanilha);

        // --- Configurações de Mesclagem de Células ---
        // As linhas de mesclagem são relativas ao dadosParaPlanilha.length
        ws['!merges'] = [
            { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }, // Título "CONTROLE DE GASTOS"
            { s: { r: dadosParaPlanilha.length - 3, c: 0 }, e: { r: dadosParaPlanilha.length - 3, c: 1 } } // PREVISAO DE GASTOS
        ];

        // --- Estilos de Células (Negrito, Cores, Formato de Moeda) ---
        // Estilo para o título "CONTROLE DE GASTOS" (B1)
        if (ws['B1']) {
            ws['B1'].s = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "FFE0E0E0" } }
            };
        }

        // Estilo para os cabeçalhos da tabela (A2, B2, C2, D2)
        const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFF0F0F0" } } };
        if (ws['A2']) ws['A2'].s = headerStyle;
        if (ws['B2']) ws['B2'].s = headerStyle;
        if (ws['C2']) ws['C2'].s = headerStyle;
        if (ws['D2']) ws['D2'].s = headerStyle;

        // Estilo para as colunas de dados da tabela principal (dinâmico)
        for (let i = 2; i < dadosParaPlanilha.length - 4; i++) { // Ignora o título, cabeçalhos, linha vazia e totais
            const valorCell = XLSX.utils.encode_cell({ r: i, c: 1 });
            const saldoCell = XLSX.utils.encode_cell({ r: i, c: 2 });
            const jaGasteiCell = XLSX.utils.encode_cell({ r: i, c: 3 });

            if (ws[valorCell]) ws[valorCell].s = { numFmt: 'R$ #,##0.00' };
            if (ws[saldoCell]) ws[saldoCell].s = { fill: { fgColor: { rgb: "FFD9EDC8" } }, numFmt: 'R$ #,##0.00;[Red]-R$ #,##0.00' };
            if (ws[jaGasteiCell]) ws[jaGasteiCell].s = { fill: { fgColor: { rgb: "FFFEEFB3" } }, numFmt: 'R$ #,##0.00;[Red]-R$ #,##0.00' };
        }

        // Estilo para os totais finais
        const totalHeaderStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFF0F0F0" } } };
        const totalValueStyle = { font: { bold: true }, numFmt: 'R$ #,##0.00;[Red]-R$ #,##0.00', fill: { fgColor: { rgb: "FFF0F0F0" } } };

        const rowIndexPrevisao = dadosParaPlanilha.length - 3;
        const rowIndexJaGastos = dadosParaPlanilha.length - 2;
        const rowIndexSaldo = dadosParaPlanilha.length - 1;

        if (ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 0 })]) ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 0 })].s = totalHeaderStyle;
        if (ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 2 })]) ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 2 })].s = totalValueStyle;

        if (ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 0 })]) ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 0 })].s = totalHeaderStyle;
        if (ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 1 })]) ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 1 })].s = totalValueStyle;

        if (ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 0 })]) ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 0 })].s = totalHeaderStyle;
        if (ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 1 })]) ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 1 })].s = totalValueStyle;

        // Definir larguras de coluna
        ws['!cols'] = [
            { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Controle de Gastos");
        XLSX.writeFile(wb, "controle_gastos_personalizado.xlsx");
    });

    // --- Inicialização da Página ---
    function init() {
        loadUserConfig();
        carregarGastos(); // Carrega os gastos independentemente da configuração

        if (userConfig.categoriasComOrcamento && userConfig.categoriasComOrcamento.length > 0) {
            showPage('tracking-page');
            initializeTrackingPage();
        } else {
            showPage('setup-page');
            renderSetupCategories();
        }
    }

    init(); // Chama a função de inicialização quando o DOM estiver pronto
});
