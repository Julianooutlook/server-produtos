import express, { json } from 'express';
import { promises as fs } from 'fs';
import { body, validationResult } from 'express-validator';
import { lerProdutos, atualizarProduto, apagarProduto, lerProdutoPorId } from './regrasDeNegocio.js';
import { produtosParaEstoque } from './produtosEmEstoque/produtosEstoque.js';
import { v4 as uuidv4 } from 'uuid'; 
import cors from 'cors'
import createError from 'http-errors';
import jwt from 'jwt-simple';
import moment from 'moment';
import config from 'config';

const port = process.env.PORT || 3000;
const app = express();
app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Api Do pastel de flango');
});

app.post('/login', (request, response, next) => {
    const { username, password } = request.body

    if (username === 'pastelDeFlango' && password === '83nd756fh30ft4') {
        const token = jwt.encode({
            user: username,
            exp: moment().add(60, 'minutes').unix()
        }, config.get('jwtTokenSecret'))
        return response.json({ token })
    }
    next(createError(401, 'Unauthorized'));
});

const verifyjwt = (req, res, next) => {
  
    const token = req.query.token || req.headers['x-token'];

    if (!token ) {
        return next(createError(401, 'Unauthorized'));
    }

    try {
        const decoded = jwt.decode(token, config.get('jwtTokenSecret'));
        const isExpired = moment.unix(decoded.exp).isBefore(new Date())

        if (isExpired) {
            next(createError(401, 'Unauthorized'));
        } else {
            req.user = decoded.user
            next()
        }
    } catch (err) {
        err.status = 401
        return next(err)
    }
}


function criarIdAleatoria() {
    return uuidv4(); 
}

app.delete('/produtos/:id', verifyjwt, async (req, res) => {
    const id = req.params.id;
    const produto = await apagarProduto(id);

    if (produto) {
        res.status(200).json({ message: 'Produto excluído com sucesso!', produto });
    } else {
        res.status(404).json({ message: 'Produto não encontrado!' });
    }
});

app.put('/produtos/:id', verifyjwt, async (req, res) => {
    const id = req.params.id;
    const modificarProduto = req.body;
    const produtoAtualizado = await atualizarProduto(id, modificarProduto);

    if (produtoAtualizado) {
        res.status(200).json(produtoAtualizado);
    } else {
        res.status(404).json({ message: 'Produto não encontrado!' });
    }
});

app.get('/produtos/:id', verifyjwt, async (req, res) => {
    const id = req.params.id;
    const produto = await lerProdutoPorId(id);

    if (produto) {
        res.json(produto);
    } else {
        res.status(404).json({ message: 'Produto não encontrado!' });
    }
});

app.get('/produtos', verifyjwt, async (req, res) => {
    const jsonData = await lerProdutos();
    res.json(jsonData.produtos);
});

app.post('/produto', verifyjwt, [
    body('nome').notEmpty().withMessage('O nome do produto é obrigatório'),
    body('peso').isFloat({ gt: 0 }).withMessage('O peso deve ser um número maior que zero'),
    body('preço').isFloat({ gt: 0 }).withMessage('O preço deve ser maior que zero'),
    body('descrição').custom((valor, { req }) => {
        const nomeProduto = req.body.nome.toLowerCase();
        const massaPastelGrande = "pastel grande"
        const massaPastelBananada = "pastel bananada"
        const massaPastelDegustação = "pastel degustação"
        const massaPastelPequeno = "pastel pequeno"
        const massaPastelLasanha = "lasanha"
        const massaPastelEspecial = "15 x 20"
        const descriçãoValida = "20 folhas"


        if (nomeProduto === massaPastelGrande || nomeProduto === massaPastelDegustação || nomeProduto === massaPastelBananada || nomeProduto === massaPastelLasanha || nomeProduto === massaPastelEspecial || nomeProduto === massaPastelPequeno) {
            if (valor.toLowerCase() !== descriçãoValida) {
                throw new Error('A descrição deve ser: 20 folhas ');

            }

        }

        if (nomeProduto === 'pizza' || nomeProduto === 'talharim' || nomeProduto === 'rolo' || nomeProduto === 'nhoque') {
            if (valor.toLowerCase() !== nomeProduto) {
                throw new Error('A descrição deve ser igual ao nome para produtos como pizza, talharim, rolo, nhoque');
            }
        }

        return true;
    })

],

    async (req, res) => {

        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.status(400).json({ erros: erros.array() });
        }

        const { nome, peso, preço, descrição } = req.body;


        const produtosEstoque = produtosParaEstoque();
        if (!produtosEstoque.includes(nome.toLowerCase())) {
            return res.status(400).json({ erro: 'Nome de produto não permitido' });
        }


        try {

            const arquivo = await fs.readFile('produtos/data.json', 'utf8');
            let dados = { produtos: [] };
            if (arquivo) {
                dados = JSON.parse(arquivo);
                if (!Array.isArray(dados.produtos)) {
                    dados.produtos = []; 
                }
            }

            const produtoExistente = dados.produtos.find(produto => produto.nome.toLowerCase() === nome.toLowerCase());
            if (produtoExistente) {
                return res.status(400).json({ erro: 'O produto já existe no estoque' });
            }

        
            const novoProduto = {
                nome,
                peso,
                preço,
                descrição,
                id: criarIdAleatoria() 
            };

            dados.produtos.push(novoProduto);

            await fs.writeFile('produtos/data.json', JSON.stringify(dados, null, 2), 'utf8');

            res.status(201).json(novoProduto);

        } catch (err) {
            console.error('Erro ao manipular o arquivo JSON:', err);
            res.status(500).json({ erro: 'Erro ao salvar o produto no estoque' });
        }
    });

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
