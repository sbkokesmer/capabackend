// app.js
import express from 'express';
import cors from 'cors';
import variationRoutes from './routes/variations.js';
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/products', productRoutes);
app.use('/api/variations', variationRoutes);
app.use('/api/customers', customerRoutes);

app.listen(PORT, () => {
  console.log(`✅ API is running at http://localhost:${PORT}/api/products/:stockCode/variations`);
});