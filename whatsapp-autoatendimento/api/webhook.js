const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "smartup_webhook_123";

module.exports = function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Token inválido");
  }

  if (req.method === "POST") {
    console.log("Webhook recebido:", JSON.stringify(req.body, null, 2));
    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(405).send("Método não permitido");
};