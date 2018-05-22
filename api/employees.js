const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const validateEmployee = (req, res, next) => {
  const newEmployee = req.body.employee;
  newEmployee.isCurrentEmployee = (newEmployee.isCurrentEmployee === 0) ? 0 : 1;
  if (!newEmployee.name || !newEmployee.position || !newEmployee.wage) {
    return res.sendStatus(400);
  } else {
    req.newEmployee = newEmployee;
    next();
  }
};

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE id = $employeeId';
  const values = {$employeeId: employeeId};
  db.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE is_current_employee = 1', 
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({employees: employees});
      }
    }
  );
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});

employeesRouter.post('/', validateEmployee, (req, res, next) => {
  
  const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
              VALUES ($name, $position, $wage, $isCurrentEmployee)`;
  const values = {
    $name: req.newEmployee.name,
    $position: req.newEmployee.position,
    $wage: req.newEmployee.wage,
    $isCurrentEmployee: req.newEmployee.isCurrentEmployee
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`,
        (error, employee) => {
          res.status(201).json({employee: employee});
        });
    }
  });
});

employeesRouter.put('/:employeeId', validateEmployee, (req, res, next) => {
  
  const sql = `UPDATE Employee SET name = $name, position = $position, 
                wage = $wage, is_current_employee = $isCurrentEmployee
              WHERE id = $employeeId`;
  const values = {
    $name: req.newEmployee.name,
    $position: req.newEmployee.position,
    $wage: req.newEmployee.wage,
    $isCurrentEmployee: req.newEmployee.isCurrentEmployee,
    $employeeId: req.employee.id
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.employee.id}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE id = $employeeId';
  const values = {$employeeId: req.employee.id};

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = ${req.employee.id}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

module.exports = employeesRouter;