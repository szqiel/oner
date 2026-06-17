require('dotenv').config();
const express = require('express');
const cors = require('cors');

const orchestrationRoutes = require('./routes/orchestration');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', orchestrationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'oner-backend' });
});

app.listen(PORT, () => {
    console.log(`Oner Backend (Codeband Orchestrator) listening on port ${PORT}`);
});
