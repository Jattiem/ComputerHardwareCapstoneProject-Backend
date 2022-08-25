const express = require("express");
const router = express.Router();
const con = require("../config/dbconn");

router.get("/", (req, res) => {
  try {
    con.query("SELECT * FROM products", (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.get("/:id", (req, res) => {
  try {
    con.query(
      `SELECT * FROM products WHERE id = "${req.params.id}"`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/", (req, res) => {
  const { brand, Model, description, price, img, category } = req.body;
  try {
    con.query(
      `INSERT INTO products (brand,Model,description,price,img,category) values('${brand}', '${Model}', '${description}', '${price}', '${img}', '${category}') `,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error });
  }
});

router.put("/:id", (req, res) => {
  const { brand, Model, description, price, img, category } = req.body;
  try {
    con.query(
      `UPDATE  FROM products SET brand='${brand}',Model='${Model}', price='${price}', description='${description}', price='${price}' img ='${img}', category='${category}', WHERE products =${req.params.id}`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

//Delete user
router.delete('/:id', (req, res)=>{
  const deleteProduct = `
      DELETE FROM products WHERE id = ${req.params.id};
  `

  con.query(deleteProduct, (err, result)=>{
      if (err) throw err
      res.json({
          status: 204,
          msg: 'User Deleted Successfully',
          users: result
      })
  })
})

module.exports = router;