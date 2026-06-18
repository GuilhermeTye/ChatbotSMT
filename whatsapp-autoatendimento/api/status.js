module.exports = function handler(req, res) {
  return res.status(200).json({
    online: true,
    sistema: "SmartUp Atendimento",
  });
};