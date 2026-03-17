import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import paymentsRouter from './routes/payments.js';
import { migrate } from './db.js';

migrate();

const app = express();
app.set('trust proxy', true);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.use('/api', paymentsRouter);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});

