const express = require('express');
const menuItemsRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const validateMenuItem = (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  newMenuItem.menuId = req.menu.id;
  if (!newMenuItem.name || !newMenuItem.inventory || !newMenuItem.price || !newMenuItem.menuId) {
    return res.sendStatus(400);
  } else {
    req.newMenuItem = newMenuItem;
    next();
  }
};

menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: menuItemId};
  db.get(sql, values, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menuItemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = $menuId';
  const values = {$menuId: req.menu.id};
  db.all(sql, values, (err, menuItems) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menuItems: menuItems});
    }
  }
  );
});

menuItemsRouter.get('/:menuItemId', (req, res, next) => {
  res.status(200).json({menuItem: req.menuItem});
});

menuItemsRouter.post('/', validateMenuItem, (req, res, next) => {
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
              VALUES ($name, $description, $inventory, $price, $menuId)`;
  const values = {
    $name: req.newMenuItem.name,
    $description: req.newMenuItem.description,
    $inventory: req.newMenuItem.inventory,
    $price: req.newMenuItem.price,
    $menuId: req.newMenuItem.menuId
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
        (error, menuItem) => {
          res.status(201).json({menuItem: menuItem});
        });
    }
  });
});

menuItemsRouter.put('/:menuItemId', validateMenuItem, (req, res, next) => {
  const sql = `UPDATE MenuItem SET name = $name, description = $description, 
                inventory = $inventory, price = $price, menu_id = $menuId
              WHERE id = $menuItemId`;
  const values = {
    $name: req.newMenuItem.name,
    $description: req.newMenuItem.description,
    $inventory: req.newMenuItem.inventory,
    $price: req.newMenuItem.price,
    $menuId: req.newMenuItem.menuId,
    $menuItemId: req.menuItem.id
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${req.menuItem.id}`,
        (error, menuItem) => {
          res.status(200).json({menuItem: menuItem});
        });
    }
  });
});

menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: req.menuItem.id};

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuItemsRouter;