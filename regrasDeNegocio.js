import { promises as fs } from 'fs';

let proximoId = 0;


function criarIdAleatoria() {
    return Math.random().toString(10).substring(2);
}


async function criarProduto(produto) {
    proximoId = criarIdAleatoria(); 
    produto.id = proximoId; 

    await criaArquivoJson(produto); 
    return produto; 
}

async function criaArquivoJson(produto) {
    try {
        let dados;
        try {
           
            const arquivo = await fs.readFile('produtos/data.json', 'utf8');
            dados = JSON.parse(arquivo); 
        } catch (err) {
            dados = { produtos: [] };
        }

        dados.produtos.push(produto);
        const jsonData = JSON.stringify(dados, null, 2);
        await fs.writeFile('produtos/data.json', jsonData, 'utf8');
        console.log('Produto adicionado ao arquivo JSON com sucesso!');
    } catch (err) {
        console.error('Erro ao criar o arquivo JSON:', err);
    }
}


async function lerProdutos() {
    try {
        const dadosLidos = await fs.readFile('produtos/data.json', 'utf8');
        return JSON.parse(dadosLidos); 
    } catch (err) {
        console.log('Erro ao ler o arquivo:', err);
        return { produtos: [] };
    }
}

async function atualizarProduto(id, produtoAtualizado) {
    try {
        const dados = await lerProdutos(); 
        const index = dados.produtos.findIndex((produto) => produto.id === id); 

        if (index !== -1) {
            dados.produtos[index] = { ...dados.produtos[index], ...produtoAtualizado, id };
            const jsonData = JSON.stringify(dados, null, 2);
            await fs.writeFile('produtos/data.json', jsonData, 'utf8');
            console.log('Produto atualizado com sucesso!');
            return dados.produtos[index]; 
        }
        return null; 
    } catch (err) {
        console.error('Erro ao atualizar o produto:', err);
        return null; 
    }
}

async function lerProdutoPorId(id) {
    try {
        const dados = await lerProdutos(); 
        const produto = dados.produtos.find((produto) => produto.id === id); 

        return produto || null; 
    } catch (err) {
        console.error('Erro ao ler o produto por ID:', err);
        return null; 
    }
}

async function apagarProduto(id) {
    try {
        const dados = await lerProdutos(); 
        const index = dados.produtos.findIndex((produto) => produto.id === id); 

        if (index !== -1) {
            const produtoRemovido = dados.produtos.splice(index, 1); 
            const jsonData = JSON.stringify(dados, null, 2);
            await fs.writeFile('produtos/data.json', jsonData, 'utf8');
            console.log('Produto removido com sucesso!');
            return produtoRemovido[0]; 
        }
        return null; 
    } catch (err) {
        console.error('Erro ao apagar o produto:', err);
        return null; 
    }
}

export { lerProdutos, atualizarProduto, apagarProduto, criarProduto, lerProdutoPorId };
