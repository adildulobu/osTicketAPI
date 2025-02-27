// api/index.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const twilio = require("twilio");
const https = require("https");

const app = express();

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
        rejectUnauthorized: false
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

        res.status(200).send("OK");
    } catch (error) {
        console.error(
            "Erro ao criar ticket:",
            error.response ? error.response.data : error.message
        );
        res.status(500).send("Erro interno", error);
    }
});

module.exports = app;