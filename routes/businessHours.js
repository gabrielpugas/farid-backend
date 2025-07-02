const express = require('express');
const router = express.Router();
const pool = require('../db/pool'); // ou caminho correto para sua conexão

// GET business hours
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM business_hours ORDER BY day_of_week');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar business hours:', err);
    res.status(500).send('Erro interno');
  }
});

// PUT business hours
router.put('/', async (req, res) => {
  const updates = req.body.map(day => ({
  day_of_week: day.dayOfWeek,
  is_open: day.isOpen,
  open_time: day.openTime,
  close_time: day.closeTime
    })); // espera um array de objetos

  try {
    const promises = updates.map(day =>
      pool.query(
        `UPDATE business_hours
         SET is_open = $1, open_time = $2, close_time = $3
         WHERE day_of_week = $4`,
        [day.is_open, day.open_time, day.close_time, day.day_of_week]
      )
    );

    await Promise.all(promises);
    res.status(200).send('Business hours atualizados com sucesso');
  } catch (err) {
    console.error('Erro ao atualizar business hours:', err);
    res.status(500).send('Erro interno');
  }
});

module.exports = router;