import cors from 'cors';
import express from 'express';
import { connectToDatabase } from './config/db.js';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import historyRoutes from './routes/history.routes.js';
import productsRoutes from './routes/products.routes.js';
import recipeIngredientsRoutes from './routes/recipeIngredients.routes.js';
import recipesRoutes from './routes/recipes.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { seedGlobalRecipes } from './utils/seedGlobalRecipes.js';

const app = express();

app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin }));
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'PantryNow backend is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/recipes', requireAuth, recipesRoutes);
app.use('/api/history', requireAuth, historyRoutes);
app.use('/api/recipe-ingredients', requireAuth, recipeIngredientsRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: 'Unexpected server error', details: error.message });
});

const start = async () => {
  try {
    await connectToDatabase(env.mongodbUri);
    await seedGlobalRecipes();
    app.listen(env.port, () => {
      console.log(`PantryNow backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
};

start();
