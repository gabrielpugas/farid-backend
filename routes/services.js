const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services WHERE enabled = true ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).send('Erro interno ao buscar serviços');
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, duration, price } = req.body;

  try {
    await pool.query(
      `UPDATE services
       SET name = $1, duration = $2, price = $3
       WHERE id = $4`,
      [name, duration, price, id]
    );

    res.status(200).send('Serviço atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).send('Erro interno');
  }
});

router.post('/', async (req, res) => {
  const { name, description, duration, price } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO services (name, description, duration, price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, duration, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).send('Erro ao criar serviço');
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      'UPDATE services SET enabled = false WHERE id = $1',
      [id]
    );
    res.status(200).send('Serviço desativado com sucesso');
  } catch (error) {
    console.error('Erro ao desativar serviço:', error);
    res.status(500).send('Erro interno');
  }
});

module.exports = router;