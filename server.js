const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');

const apiRouter = require('./api/api.js');

const app = express();
const PORT = process.env.port || 4000;

app.use(bodyParser.json());
app.use(cors());

app.use('/api', apiRouter);

app.use(morgan('dev'));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

module.exports = app;