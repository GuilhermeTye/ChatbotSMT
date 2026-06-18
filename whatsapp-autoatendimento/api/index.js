const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const VERIFY_TOKEN =
  process.env.VERIFY_TOKEN || "smartup_webhook_123";

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

/* STATUS */

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    sistema: "SmartUp Atendimento",
    webhook: true,
  });
});

/* WEBHOOK META */

app.get("/api/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Verificação Meta:", {
    mode,
    token,
    challenge,
  });

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/api/webhook", (req, res) => {
  console.log(
    "Webhook recebido:",
    JSON.stringify(req.body, null, 2)
  );

  return res.sendStatus(200);
});

/* LOGIN */

app.post("/api/login", (req, res) => {
  const { usuario, senha } = req.body;

  const usuarioEncontrado = usuarios.find(
    (u) =>
      u.usuario === usuario &&
      u.senha === senha
  );

  if (!usuarioEncontrado) {
    return res.status(401).json({
      erro: "Usuário ou senha inválidos",
    });
  }

  return res.json({
    usuario: usuarioEncontrado.usuario,
    nome: usuarioEncontrado.nome,
    setor: usuarioEncontrado.setor,
    tipo: usuarioEncontrado.tipo,
  });
});

/* MENU */

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
  conversas[numero].status =
    "aguardando_atendente";
}

function processarMensagem(numero, mensagem) {
  if (!conversas[numero]) {
    criarConversa(numero);
  }

  registrarMensagem(
    numero,
    "cliente",
    mensagem
  );

  const texto = mensagem.trim().toLowerCase();

  let resposta = "";

  switch (texto) {
    case "1":
      definirSetor(numero, "Financeiro");
      resposta =
        "💰 Sua conversa foi direcionada para o Financeiro.";
      break;

    case "2":
      definirSetor(numero, "Atendimento");
      resposta =
        "👨‍💼 Sua conversa foi direcionada para Atendimento.";
      break;

    case "3":
      definirSetor(numero, "Logística");
      resposta =
        "🚚 Sua conversa foi direcionada para Logística.";
      break;

    case "4":
      definirSetor(numero, "Atendimento");
      resposta =
        "🙋 Um atendente humano continuará o atendimento.";
      break;

    default:
      resposta = menuPrincipal();
  }

  registrarMensagem(
    numero,
    "bot",
    resposta
  );

  return resposta;
}

/* MENSAGEM */

app.post("/api/mensagem", (req, res) => {
  const { numero, mensagem } = req.body;

  if (!numero || !mensagem) {
    return res.status(400).json({
      erro: "Número e mensagem obrigatórios",
    });
  }

  const resposta = processarMensagem(
    numero,
    mensagem
  );

  return res.json({
    recebido: mensagem,
    resposta,
    conversa: conversas[numero],
  });
});

/* CONVERSAS */

app.get("/api/conversas", (req, res) => {
  const { setor, tipo } = req.query;

  let lista = Object.values(conversas);

  if (tipo !== "admin") {
    lista = lista.filter(
      (c) => c.setor === setor
    );
  }

  return res.json(lista);
});

app.get("/api/conversas/:numero", (req, res) => {
  const { numero } = req.params;

  if (!conversas[numero]) {
    return res.status(404).json({
      erro: "Conversa não encontrada",
    });
  }

  return res.json(conversas[numero]);
});

/* RESPONDER */

app.post("/api/responder", (req, res) => {
  const {
    numero,
    mensagem,
    usuario,
  } = req.body;

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

  conversas[numero].status =
    "em_atendimento";

  return res.json({
    sucesso: true,
  });
});

module.exports = app;