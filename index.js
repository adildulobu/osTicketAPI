require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const twilio = require("twilio");
const https = require("https"); // Módulo nativo para HTTPS

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurar cliente Twilio
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Configurar Axios para ignorar certificados autoassinados
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false // Ignora certificados inválidos
    })
});

// Rota WhatsApp
app.post("/whatsapp", async (req, res) => {
    const { From, Body } = req.body;

    console.log(`Nova mensagem de ${From}: ${Body}`);

    try {
        const fullUrl = `${process.env.OSTICKET_URL}/api/tickets.json`;
        console.log("Tentando acessar:", fullUrl);

        const ticketResponse = await axiosInstance.post(
            fullUrl,
            {
                name: "Cliente WhatsApp",
                email: "cliente@exemplo.com",
                phone: From.replace("whatsapp:", ""),
                subject: "Novo Ticket via WhatsApp",
                message: Body
            },
            {
                headers: {
                    "X-API-Key": process.env.OSTICKET_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Ticket criado com sucesso:", ticketResponse.data);

        await twilioClient.messages.create({
            body: "Seu pedido foi registado no sistema. Em breve, entraremos em contacto! 🎟️",
            from: process.env.TWILIO_PHONE_NUMBER,
            to: From
        });

        res.sendStatus(200);
    } catch (error) {
        console.error(
            "Erro ao criar ticket:",
            error.response ? error.response.data : error.message
        );
        res.sendStatus(500);
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});