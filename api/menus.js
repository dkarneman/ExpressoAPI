const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menuItems.js');

const validateMenu = (req, res, next) => {
  const newMenu = req.body.menu;
  if (!newMenu.title) {
    return res.sendStatus(400);
  } else {
    req.newMenu = newMenu;
    next();
  }
};

menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE id = $menuId';
  const values = {$menuId: menuId};
  db.get(sql, values, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', 
    (err, menus) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({menus: menus});
      }
    }
  );
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});

menusRouter.post('/', validateMenu, (req, res, next) => {
  const sql = `INSERT INTO Menu (title)
              VALUES ($title)`;
  const values = {
    $title: req.newMenu.title,
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`,
        (error, menu) => {
          res.status(201).json({menu: menu});
        });
    }
  });
});

menusRouter.put('/:menuId', validateMenu, (req, res, next) => {
  
  const sql = `UPDATE Menu SET title = $title
              WHERE id = $menuId`;
  const values = {
    $title: req.newMenu.title,
    $menuId: req.menu.id
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = ${req.menu.id}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
});

menusRouter.delete('/:menuId', (req, res, next) => {
  const values = {$menuId: req.menu.id};
  
  db.all('SELECT * FROM MenuItem where menu_id = $menuId',values,(err, menuItems) => {
    if (err) {
      next(err);
    } else if (menuItems.length > 0) {
      res.sendStatus(400);
    } else {
      db.run('DELETE FROM Menu WHERE id = $menuId', values, function(error) {
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

module.exports = menusRouter;