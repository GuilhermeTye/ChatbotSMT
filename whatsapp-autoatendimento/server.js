const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const PORT = 3000;

const conversas = {};

const usuarios = [
  {
    usuario: "financeiro",
    senha: "123",
    nome: "Financeiro",
    setor: "Financeiro",
    tipo: "setor",
  },
  {
    usuario: "atendimento",
    senha: "123",
    nome: "Atendimento",
    setor: "Atendimento",
    tipo: "setor",
  },
  {
    usuario: "logistica",
    senha: "123",
    nome: "Logística",
    setor: "Logística",
    tipo: "setor",
  },
  {
    usuario: "admin",
    senha: "123",
    nome: "Administrador",
    setor: "Todos",
    tipo: "admin",
  },
];

function menuPrincipal() {
  return `Olá 👋

Bem-vindo ao atendimento automático.

Digite uma opção:

1 - Financeiro
2 - Atendimento
3 - Logística
4 - Falar com humano`;
}

function criarConversa(numero) {
  conversas[numero] = {
    numero,
    setor: null,
    status: "bot",
    mensagens: [],
  };
}

function registrarMensagem(numero, remetente, texto) {
  conversas[numero].mensagens.push({
    remetente,
    texto,
    data: new Date().toLocaleString("pt-BR"),
  });
}

function definirSetor(numero, setor) {
  conversas[numero].setor = setor;
  conversas[numero].status = "aguardando_atendente";
}

function processarMensagem(numero, mensagem) {
  if (!conversas[numero]) {
    criarConversa(numero);
  }

  registrarMensagem(numero, "cliente", mensagem);

  const texto = mensagem.trim().toLowerCase();

  let resposta = "";

  if (texto === "1") {
    definirSetor(numero, "Financeiro");

    resposta = `💰 Certo!

Sua conversa foi direcionada para o setor Financeiro.

Aguarde, em breve um atendente continuará o atendimento por aqui mesmo.`;
  } else if (texto === "2") {
    definirSetor(numero, "Atendimento");

    resposta = `👨‍💼 Certo!

Sua conversa foi direcionada para o setor de Atendimento.

Aguarde, em breve um atendente continuará o atendimento por aqui mesmo.`;
  } else if (texto === "3") {
    definirSetor(numero, "Logística");

    resposta = `🚚 Certo!

Sua conversa foi direcionada para o setor de Logística.

Aguarde, em breve um atendente continuará o atendimento por aqui mesmo.`;
  } else if (texto === "4") {
    definirSetor(numero, "Atendimento");

    resposta = `🙋 Certo!

Um atendente humano irá continuar o atendimento por aqui mesmo.`;
  } else {
    resposta = menuPrincipal();
  }

  registrarMensagem(numero, "bot", resposta);

  return resposta;
}

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  const usuarioEncontrado = usuarios.find(
    (u) => u.usuario === usuario && u.senha === senha
  );

  if (!usuarioEncontrado) {
    return res.status(401).json({
      erro: "Usuário ou senha inválidos",
    });
  }

  res.json({
    usuario: usuarioEncontrado.usuario,
    nome: usuarioEncontrado.nome,
    setor: usuarioEncontrado.setor,
    tipo: usuarioEncontrado.tipo,
  });
});

app.post("/mensagem", (req, res) => {
  const { numero, mensagem } = req.body;

  if (!numero || !mensagem) {
    return res.status(400).json({
      erro: "Número e mensagem obrigatórios",
    });
  }

  const resposta = processarMensagem(numero, mensagem);

  res.json({
    recebido: mensagem,
    resposta,
    conversa: conversas[numero],
  });
});

app.get("/conversas", (req, res) => {
  const setor = req.query.setor;
  const tipo = req.query.tipo;

  let lista = Object.values(conversas);

  if (tipo !== "admin") {
    lista = lista.filter((conversa) => conversa.setor === setor);
  }

  res.json(lista);
});

app.get("/conversas/:numero", (req, res) => {
  const { numero } = req.params;

  if (!conversas[numero]) {
    return res.status(404).json({
      erro: "Conversa não encontrada",
    });
  }

  res.json(conversas[numero]);
});

app.post("/responder", (req, res) => {
  const { numero, mensagem, usuario } = req.body;

  if (!numero || !mensagem) {
    return res.status(400).json({
      erro: "Número e mensagem obrigatórios",
    });
  }

  if (!conversas[numero]) {
    return res.status(404).json({
      erro: "Conversa não encontrada",
    });
  }

  conversas[numero].mensagens.push({
    remetente: "atendente",
    usuario: usuario || "Atendente",
    texto: mensagem,
    data: new Date().toLocaleString("pt-BR"),
  });

  conversas[numero].status = "em_atendimento";

  res.json({
    sucesso: true,
    conversa: conversas[numero],
  });
});

app.listen(PORT, () => {
  console.log("Servidor iniciado");
  console.log(`http://localhost:${PORT}`);
});