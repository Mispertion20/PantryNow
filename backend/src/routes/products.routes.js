import express from 'express';
import { Product } from '../models/Product.js';
import { getNextId } from '../utils/counter.js';
import { toProductDto } from '../utils/mappers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const products = await Product.find({ ownerId }).sort({ id: 1 });
    return res.status(200).json({ data: products.map(toProductDto) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch products', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { name, quantity, unit } = req.body;

    if (!name || quantity == null || !unit) {
      return res.status(400).json({ message: 'Name, quantity, and unit are required' });
    }

    const id = await getNextId(ownerId, 'products');
    const product = await Product.create({
      ownerId,
      id,
      name: String(name).trim(),
      quantity: Number(quantity),
      unit: String(unit).trim(),
      updated_at: new Date(),
    });

    return res.status(201).json({ data: toProductDto(product) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create product', details: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);
    const { name, quantity, unit } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const updates = {};

    if (name != null) {
      const normalizedName = String(name).trim();
      if (!normalizedName) {
        return res.status(400).json({ message: 'Product name cannot be empty' });
      }
      updates.name = normalizedName;
    }

    if (unit != null) {
      const normalizedUnit = String(unit).trim();
      if (!normalizedUnit) {
        return res.status(400).json({ message: 'Product unit cannot be empty' });
      }
      updates.unit = normalizedUnit;
    }

    if (quantity != null) {
      const normalizedQuantity = Number(quantity);
      if (Number.isNaN(normalizedQuantity) || normalizedQuantity < 0) {
        return res.status(400).json({ message: 'Quantity must be a valid non-negative number' });
      }
      updates.quantity = normalizedQuantity;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'At least one field (name, quantity, unit) must be provided' });
    }

    const product = await Product.findOneAndUpdate(
      { ownerId, id },
      {
        $set: {
          ...updates,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ data: toProductDto(product) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update product', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    await Product.deleteOne({ ownerId, id });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product', details: error.message });
  }
});

export default router;
