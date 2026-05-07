const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const keys = JSON.parse(
    fs.readFileSync(path.join(__dirname, "keys.json"), "utf8")
);

app.post("/perguntar", async (req, res) => {
    try {
        const pergunta = req.body.pergunta;

        const response = await fetch(`${keys.AZURE_ENDPOINT}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": keys.AZURE_API_KEY
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "Você é o SITE-GPT." },
                        { role: "user", content: pergunta }
                    ],
                    temperature: 0.7,
                    max_tokens: 800
                })
            }
        );

        const data = await response.json();

        res.json({
            resposta: data.choices?.[0]?.message?.content || "Sem resposta."
        });

    } catch (error) {
        res.status(500).json({
            resposta: "Erro ao consultar ChatGPT."
        });        
    }
});

