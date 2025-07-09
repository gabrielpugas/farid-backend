const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Função para gerar slots de tempo
function formatToBrazilISO(date) {
  return date.toLocaleString('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    hour12: false
  }).replace(' ', 'T'); // gera "2025-07-08T06:00:00"
}

function generateTimeSlots(openTime, closeTime, duration, date) {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const slots = [];
  let current = new Date(date);
  current.setHours(openHour, openMinute, 0, 0);

  const end = new Date(date);
  end.setHours(closeHour, closeMinute, 0, 0);

  while (current < end) {
    const start = new Date(current);
    const finish = new Date(current.getTime() + duration * 60000);

    if (finish <= end) {
      slots.push({
            startTime: formatToBrazilISO(start),
            endTime: formatToBrazilISO(finish)
        });
    }

    current = finish;
  }
    
  return slots;
}

router.get('/', async (req, res) => {
  const { date, service_id } = req.query;

  if (!date || !service_id) {
    return res.status(400).json({ error: 'Parâmetros "date" e "service_id" são obrigatórios' });
  }

  try {
    // Buscar duração do serviço
    const serviceResult = await pool.query('SELECT duration FROM services WHERE id = $1', [service_id]);
    if (serviceResult.rowCount === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const duration = serviceResult.rows[0].duration;

    // Buscar horário de funcionamento do dia
    const weekDay = new Date(date).getDay(); // 0 = domingo ... 6 = sábado
    const hoursResult = await pool.query(
      'SELECT open_time, close_time, is_open FROM business_hours WHERE day_of_week = $1',
      [weekDay]
    );

    const dayConfig = hoursResult.rows[0];
    if (!dayConfig?.is_open) {
      return res.json([]); // Dia fechado
    }

    const { open_time, close_time } = dayConfig;

    // Buscar agendamentos existentes na data
    const appointmentsResult = await pool.query(
      `SELECT time_start, time_end FROM appointments 
       WHERE date = $1 AND status NOT IN ('cancelled_by_admin', 'cancelled_by_client', 'no_show')`,
      [date]
    );

    const usedSlots = appointmentsResult.rows.map(app => ({
      start: `${date}T${app.time_start}`,
      end: `${date}T${app.time_end}`
    }));

    // Gerar todos os slots possíveis
    const allSlots = generateTimeSlots(open_time, close_time, duration, date);

    // Filtrar os que estão livres
    const available = allSlots.filter(slot => {
      return !usedSlots.some(block => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const busyStart = new Date(block.start);
        const busyEnd = new Date(block.end);

        return (
          (slotStart >= busyStart && slotStart < busyEnd) ||
          (slotEnd > busyStart && slotEnd <= busyEnd) ||
          (slotStart <= busyStart && slotEnd >= busyEnd)
        );
      });
    });
    
    res.json(available);
  } catch (error) {
    console.error('Erro ao calcular horários disponíveis:', error);
    res.status(500).json({ error: 'Erro interno ao calcular horários disponíveis' });
  }
});

module.exports = router;