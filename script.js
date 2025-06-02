document.addEventListener('DOMContentLoaded', function() {
    const valorGastoInput = document.getElementById('valorGasto');
    const botoesCategoria = document.querySelectorAll('.btn-categoria');
    const adicionarBtn = document.getElementById('adicionarBtn');
    const listaGastosDiv = document.getElementById('listaGastos'); // Div para listar gastos individuais
    const tabelaResumoBody = document.querySelector('#tabelaResumo tbody'); // Corpo da tabela de resumo
    const previsaoGastosTotalSpan = document.getElementById('previsaoGastosTotal');
    const jaGastosTotalSpan = document.getElementById('jaGastosTotal');
    const saldoTotalSpan = document.getElementById('saldoTotal');
    const exportarExcelBtn = document.getElementById('exportarExcelBtn');

    let categoriaSelecionada = '';
    let gastos = []; // Armazena os gastos individuais adicionados

    // Orçamentos fixos por categoria
    const orcamentosFixos = {
        gasolina: 1200.00,
        mercado: 4000.00,
        servicosDomesticos: 880.00,
        cuidadosPessoais: 350.00,
        passeios: 1200.00,
        outros: 0.00 // Categoria 'Outros' pode ter um orçamento inicial de 0 ou ser flexível
    };

    // Carregar Gastos Individuais do LocalStorage
    function carregarGastos() {
        const gastosSalvos = localStorage.getItem('gastosDiarios');
        if (gastosSalvos) {
            gastos = JSON.parse(gastosSalvos);
        }
    }

    // Salvar Gastos Individuais no LocalStorage
    function salvarGastos() {
        localStorage.setItem('gastosDiarios', JSON.stringify(gastos));
    }

    // Inicializa a página carregando os gastos e atualizando a exibição
    carregarGastos();
    atualizarListaGastos(); // Atualiza a lista de gastos individuais
    atualizarTabelaResumo(); // Atualiza a tabela de resumo
    atualizarTotaisGerais(); // Atualiza os totais gerais

    botoesCategoria.forEach(botao => {
        botao.addEventListener('click', function() {
            botoesCategoria.forEach(btn => btn.classList.remove('selecionado'));
            this.classList.add('selecionado');
            categoriaSelecionada = this.dataset.categoria;
        });
    });

    adicionarBtn.addEventListener('click', function() {
        const valorGasto = parseFloat(valorGastoInput.value);
        if (valorGasto > 0 && categoriaSelecionada) {
            const novoGasto = { 
                id: Date.now(), // Adiciona um ID único para fácil remoção
                categoria: categoriaSelecionada, 
                valor: valorGasto 
            };
            gastos.push(novoGasto);
            salvarGastos();
            
            atualizarListaGastos();    // Atualiza a lista individual
            atualizarTabelaResumo();   // Atualiza a tabela de resumo
            atualizarTotaisGerais();   // Atualiza os totais gerais
            
            // Limpa o input e a seleção de categoria
            valorGastoInput.value = '';
            categoriaSelecionada = '';
            botoesCategoria.forEach(btn => btn.classList.remove('selecionado'));
        } else {
            alert('Por favor, insira um valor válido e selecione uma categoria.');
        }
    });

    // Função para atualizar a lista de gastos individuais com botões de remover
    function atualizarListaGastos() {
        listaGastosDiv.innerHTML = ''; // Limpa a lista existente
        gastos.forEach((gasto, index) => {
            const gastoItem = document.createElement('div');
            gastoItem.className = 'gasto-item';
            gastoItem.innerHTML = `
                <span>${gasto.categoria.charAt(0).toUpperCase() + gasto.categoria.slice(1).replace(/([A-Z])/g, ' $1').trim()}: R$ ${gasto.valor.toFixed(2).replace('.', ',')}</span>
                <button class="btn-remover" data-id="${gasto.id}">Remover</button>
            `;
            listaGastosDiv.appendChild(gastoItem);
        });

        // Adiciona event listeners para os novos botões de remover
        document.querySelectorAll('.btn-remover').forEach(botaoRemover => {
            botaoRemover.addEventListener('click', function() {
                const idParaRemover = parseInt(this.dataset.id);
                removerGastoIndividual(idParaRemover);
            });
        });
    }

    // Função para remover um gasto individual pelo ID
    function removerGastoIndividual(id) {
        gastos = gastos.filter(gasto => gasto.id !== id);
        salvarGastos();
        
        atualizarListaGastos();    // Atualiza a lista individual
        atualizarTabelaResumo();   // Atualiza a tabela de resumo
        atualizarTotaisGerais();   // Atualiza os totais gerais
    }


    // Função para atualizar a tabela de resumo com os dados fixos e calculados
    function atualizarTabelaResumo() {
        tabelaResumoBody.innerHTML = ''; // Limpa o corpo da tabela

        let totaisPorCategoria = {};
        // Inicializa totais por categoria com 0
        for (const cat in orcamentosFixos) {
            totaisPorCategoria[cat] = 0;
        }

        // Calcula o total já gasto por cada categoria a partir dos gastos individuais
        gastos.forEach(gasto => {
            if (totaisPorCategoria.hasOwnProperty(gasto.categoria)) {
                totaisPorCategoria[gasto.categoria] += gasto.valor;
            } else {
                // Se for uma categoria 'outros' ou não mapeada, adiciona a 'outros'
                totaisPorCategoria['outros'] += gasto.valor;
            }
        });

        // Preenche a tabela com os dados
        for (const categoria in orcamentosFixos) {
            const orcamento = orcamentosFixos[categoria];
            const jaGastei = totaisPorCategoria[categoria] || 0; // Se não houver gastos, é 0
            const saldo = orcamento - jaGastei;

            const row = tabelaResumoBody.insertRow();
            row.innerHTML = `
                <td>${categoria.charAt(0).toUpperCase() + categoria.slice(1).replace(/([A-Z])/g, ' $1').trim()}</td>
                <td style="text-align: right;">R$ ${orcamento.toFixed(2).replace('.', ',')}</td>
                <td style="text-align: right; background-color: #D9EDC8;">R$ ${saldo.toFixed(2).replace('.', ',')}</td>
                <td style="text-align: right; background-color: #FEEFB3;">R$ ${jaGastei.toFixed(2).replace('.', ',')}</td>
            `;
            // Note: O botão de remover agora está na lista de gastos individuais, não na tabela de resumo por categoria
        }
    }

    // Função para atualizar os totais gerais (Previsão, Já Gastos, Saldo)
    function atualizarTotaisGerais() {
        let previsaoTotal = 0;
        for (const cat in orcamentosFixos) {
            previsaoTotal += orcamentosFixos[cat];
        }

        let jaGastosTotal = 0;
        gastos.forEach(gasto => {
            jaGastosTotal += gasto.valor;
        });

        const saldoTotal = previsaoTotal - jaGastosTotal;

        previsaoGastosTotalSpan.textContent = `R$ ${previsaoTotal.toFixed(2).replace('.', ',')}`;
        jaGastosTotalSpan.textContent = `R$ ${jaGastosTotal.toFixed(2).replace('.', ',')}`;
        saldoTotalSpan.textContent = `R$ ${saldoTotal.toFixed(2).replace('.', ',')}`;
    }

    // --- Função: Exportar para Excel com o modelo da imagem ---
    exportarExcelBtn.addEventListener('click', function() {
        const dadosParaPlanilha = [];

        // Linha 1: Título "CONTROLE DE GASTOS" (mesclado B1:D1)
        dadosParaPlanilha.push(["", "CONTROLE DE GASTOS", "", ""]); 
        // Linha 2: Cabeçalhos
        dadosParaPlanilha.push(["ITEM", "VALOR", "SALDO", "JA GASTEI"]);

        // Dados das categorias (calculados)
        let totaisPorCategoria = {};
        for (const cat in orcamentosFixos) {
            totaisPorCategoria[cat] = 0;
        }
        gastos.forEach(gasto => {
            if (totaisPorCategoria.hasOwnProperty(gasto.categoria)) {
                totaisPorCategoria[gasto.categoria] += gasto.valor;
            } else {
                totaisPorCategoria['outros'] += gasto.valor;
            }
        });

        for (const categoria in orcamentosFixos) {
            const orcamento = orcamentosFixos[categoria];
            const jaGastei = totaisPorCategoria[categoria] || 0;
            const saldo = orcamento - jaGastei;
            dadosParaPlanilha.push([
                categoria.charAt(0).toUpperCase() + categoria.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Formata o nome da categoria
                orcamento,
                saldo,
                jaGastei
            ]);
        }

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
        ws['!merges'] = [
            // Mesclar B1:D1 para "CONTROLE DE GASTOS"
            { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } },
            // Mesclar A9:B9 para "PREVISAO DE GASTOS" (ajustar índice da linha conforme dadosPlanilha)
            // A linha "PREVISAO DE GASTOS" será a 8ª linha (índice 7) se não houver linha vazia antes dela.
            // Se houver linha vazia, ela será a 9ª linha (índice 8).
            // Vamos calcular o índice dinamicamente.
            { s: { r: dadosPlanilha.length - 3, c: 0 }, e: { r: dadosPlanilha.length - 3, c: 1 } } // PREVISAO DE GASTOS
        ];

        // --- Estilos de Células (Negrito, Cores, Formato de Moeda) ---

        // Estilo para o título "CONTROLE DE GASTOS" (B1)
        if (ws['B1']) {
            ws['B1'].s = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: "center", vertical: "center" },
                fill: { fgColor: { rgb: "FFE0E0E0" } } // Cinza claro
            };
        }

        // Estilo para os cabeçalhos da tabela (A2, B2, C2, D2)
        const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFF0F0F0" } } };
        if (ws['A2']) ws['A2'].s = headerStyle;
        if (ws['B2']) ws['B2'].s = headerStyle;
        if (ws['C2']) ws['C2'].s = headerStyle;
        if (ws['D2']) ws['D2'].s = headerStyle;

        // Estilo para as colunas "SALDO" (C) e "JÁ GASTEI" (D)
        const saldoCellStyle = { fill: { fgColor: { rgb: "FFD9EDC8" } }, numFmt: 'R$ #,##0.00;[Red]-R$ #,##0.00' }; // Verde claro, formato moeda
        const jaGasteiCellStyle = { fill: { fgColor: { rgb: "FFFEEFB3" } }, numFmt: 'R$ #,##0.00;[Red]-R$ #,##0.00' }; // Amarelo claro, formato moeda
        const valorCellStyle = { numFmt: 'R$ #,##0.00' }; // Formato moeda para a coluna VALOR

        // Aplicar estilos de cor e formato de moeda para as células de dados da tabela principal
        for (let i = 2; i <= 6; i++) { // Linhas 3 a 7 (índice 2 a 6)
            const valorCell = XLSX.utils.encode_cell({ r: i, c: 1 }); // Coluna B (VALOR)
            const saldoCell = XLSX.utils.encode_cell({ r: i, c: 2 }); // Coluna C (SALDO)
            const jaGasteiCell = XLSX.utils.encode_cell({ r: i, c: 3 }); // Coluna D (JÁ GASTEI)

            if (ws[valorCell]) ws[valorCell].s = valorCellStyle;
            if (ws[saldoCell]) ws[saldoCell].s = saldoCellStyle;
            if (ws[jaGasteiCell]) ws[jaGasteiCell].s = jaGasteiCellStyle;
        }

        // Estilo para os totais finais (PREVISAO DE GASTOS, JA GASTOS, SALDO)
        const totalHeaderStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFF0F0F0" } } };
        const totalValueStyle = { font: { bold: true }, numFmt: 'R$ #,##0.00;[Red]-R$ #,##0.00', fill: { fgColor: { rgb: "FFF0F0F0" } } };

        const rowIndexPrevisao = dadosPlanilha.length - 3;
        const rowIndexJaGastos = dadosPlanilha.length - 2;
        const rowIndexSaldo = dadosPlanilha.length - 1;

        if (ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 0 })]) ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 0 })].s = totalHeaderStyle;
        if (ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 2 })]) ws[XLSX.utils.encode_cell({ r: rowIndexPrevisao, c: 2 })].s = totalValueStyle;

        if (ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 0 })]) ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 0 })].s = totalHeaderStyle;
        if (ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 1 })]) ws[XLSX.utils.encode_cell({ r: rowIndexJaGastos, c: 1 })].s = totalValueStyle;

        if (ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 0 })]) ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 0 })].s = totalHeaderStyle;
        if (ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 1 })]) ws[XLSX.utils.encode_cell({ r: rowIndexSaldo, c: 1 })].s = totalValueStyle;


        // Definir larguras de coluna
        ws['!cols'] = [
            { wch: 20 }, // A: ITEM
            { wch: 15 }, // B: VALOR
            { wch: 15 }, // C: SALDO
            { wch: 15 }  // D: JA GASTEI
        ];

        // Cria o livro do Excel e adiciona a planilha
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Controle de Gastos");

        // Gera e baixa o arquivo Excel
        XLSX.writeFile(wb, "controle_gastos_familia.xlsx");
    });
});
