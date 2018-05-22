const express = require('express');
const timesheetsRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const validateTimesheet = (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  newTimesheet.employeeId = req.employee.id;
  if (!newTimesheet.hours || !newTimesheet.rate || !newTimesheet.date || !newTimesheet.employeeId) {
    return res.sendStatus(400);
  } else {
    req.newTimesheet = newTimesheet;
    next();
  }
};

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE employee_id = $employeeId';
  const values = {$employeeId: req.employee.id};
  db.all(sql, values, (err, timesheets) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  }
  );
});

timesheetsRouter.get('/:timesheetId', (req, res, next) => {
  res.status(200).json({timesheet: req.timesheet});
});

timesheetsRouter.post('/', validateTimesheet, (req, res, next) => {
  const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
              VALUES ($hours, $rate, $date, $employeeId)`;
  const values = {
    $hours: req.newTimesheet.hours,
    $rate: req.newTimesheet.rate,
    $date: req.newTimesheet.date,
    $employeeId: req.newTimesheet.employeeId
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
        (error, timesheet) => {
          res.status(201).json({timesheet: timesheet});
        });
    }
  });
});

timesheetsRouter.put('/:timesheetId', validateTimesheet, (req, res, next) => {
  const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, 
                date = $date, employee_id = $employeeId
              WHERE id = $timesheetId`;
  const values = {
    $hours: req.newTimesheet.hours,
    $rate: req.newTimesheet.rate,
    $date: req.newTimesheet.date,
    $employeeId: req.newTimesheet.employeeId,
    $timesheetId: req.timesheet.id
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${req.timesheet.id}`,
        (error, timesheet) => {
          res.status(200).json({timesheet: timesheet});
        });
    }
  });
});

timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: req.timesheet.id};

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;