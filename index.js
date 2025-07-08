require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const agendamentoRoutes = require('./routes/apointments');
const servicoRoutes = require('./routes/services');
const businessHoursRoutes = require('./routes/businessHours');
const availableTimesRoute = require('./routes/availableTimes');


app.use(cors());
app.use(express.json());

app.use('/appointments', agendamentoRoutes);
app.use('/services', servicoRoutes);
app.use('/business-hours', businessHoursRoutes);
app.use('/available-times', availableTimesRoute);

app.listen(3001, () => console.log('Servidor rodando na porta 3001'));