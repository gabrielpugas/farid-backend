const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.post('/', async (req, res) => {
  try {
    const {
      client_name,
      client_email,
      client_phone,
      service_id,
      date,
      time_start,
      time_end,
      notes
    } = req.body;

    await pool.query(
      `INSERT INTO appointments (
        id, client_name, client_email, client_phone, service_id,
        date, time_start, time_end, notes
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8
      )`,
      [
        client_name,
        client_email,
        client_phone,
        service_id,
        date,
        time_start,
        time_end,
        notes || null
      ]
    );

    res.status(201).json({ message: 'Agendamento criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).send('Erro interno ao criar agendamento');
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, a.client_name, a.client_email, a.client_phone,
        a.service_id, a.date, a.time_start, a.time_end,
        a.status, a.notes, a.created_at, a.updated_at,
        s.name AS service_name, s.duration, s.price
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      ORDER BY a.date, a.time_start
    `);

    const appointments = result.rows.map(row => ({
      id: row.id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
      serviceId: row.service_id,
      date: row.date.toISOString(),
      timeSlot: {
        id: `${row.date.toISOString()}_${row.time_start}`,
        startTime: `${row.date.toISOString().split('T')[0]}T${row.time_start}`,
        endTime: `${row.date.toISOString().split('T')[0]}T${row.time_end}`,
        isAvailable: false
      },
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));

    res.json(appointments);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).send('Erro interno ao buscar agendamentos');
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, updatedAt } = req.body;

  try {
    await pool.query(
      `UPDATE appointments
       SET status = $1, updated_at = $2
       WHERE id = $3`,
      [status, updatedAt, id]
    );

    res.status(200).send('Agendamento atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).send('Erro interno');
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const updatedAt = new Date().toISOString();

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1, updated_at = $2
       WHERE id = $3`,
      ['cancelled_by_admin', updatedAt, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Agendamento não encontrado');
    }

    res.status(200).send('Agendamento cancelado com sucesso');
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).send('Erro interno ao cancelar agendamento');
  }
});

module.exports = router;