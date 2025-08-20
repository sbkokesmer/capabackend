// app.js
import express from 'express';
import cors from 'cors';
import variationRoutes from './routes/variations.js';
import productRoutes from './routes/products.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/variations', variationRoutes);

app.listen(PORT, () => {
  console.log(`✅ API is running at http://localhost:${PORT}/api/products/:stockCode/variations`);
});