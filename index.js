const express = require("express");
// mpn install cors
const cors = require("cors");
// npm install dotenv

const db = require("./db"); // Connexion à MySQL
const routes = require("./endpoint"); // Les routes de l'API


const app = express();
app.use(express.json());
const allowedOrigins = [
    'http://localhost:3001', // Autoriser votre frontend
    'https://cafthe.emel.kecebas.dev-campus.fr', // Autoriser l'autre origine
];

app.use(cors({
    origin: allowedOrigins,
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
}));

// Utilisation des routes
app.use("/api", routes);

// Démarrer le serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`L'API Caf'the est démarrée sur http://localhost:${PORT}`)
});