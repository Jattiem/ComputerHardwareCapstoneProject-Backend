const express = require("express");
const router = express.Router();
const con = require("../config/dbconn");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const middleware = require("../middleware/authorization");
const bodyParser = require('body-parser');

//gets users from database
router.get("/", (_req, res) => {
  try {
    con.query("SELECT * FROM users", (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Register Route
// The Route where Encryption starts
router.post("/users", (req, res) => {
  try {
    let sql = "INSERT INTO users SET ?";
    const {
      fullname,
      email,
      password,
      phonenumber
    } = req.body;

    // The start of hashing / encryption
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    let user = {
      fullname,
      email,
      // We sending the hash value to be stored witin the table
      password: hash,
      phonenumber
    };
    con.query(sql, user, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.send(`User ${(user.fullname, user.email)} created successfully`);
    });
  } catch (error) {
    console.log(error);
  }
});



/******************************************************************************************************* */
// Login
// The Route where Decryption happens
router.post("/login", (req, res) => {
  try {
    let sql = "SELECT * FROM users WHERE ?";
    let user = {
      email: req.body.email,
    };
    con.query(sql, user, async (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        res.send("Email not found please register");
      } else {
        const isMatch = await bcrypt.compare(
          req.body.password,
          result[0].password
        );
        if (!isMatch) {
          res.send("Password incorrect");
        } else {
          // The information the should be stored inside token
          const payload = {
            user: {
              id: result[0].id,
              fullname: result[0].fullname,
              email: result[0].email,
              phonenumber: result[0].phonenumber
            },
          };
          // Creating a token and setting expiry date
          jwt.sign(
            payload,
            process.env.jwtSecret,
            {
              expiresIn: "365d",
            },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
});

//Delete user
router.delete('/:id', (req, res)=>{
  const deleteUser = `
      DELETE FROM users WHERE id = ${req.params.id};
  `

  con.query(deleteUser, (err, result)=>{
      if (err) throw err
      res.json({
          status: 204,
          msg: 'User Deleted Successfully',
          users: result
      })
  })
})

// Verify
router.get("/verify", (req, res) => {
  const token = req.header("x-auth-token");
  jwt.verify(token, process.env.jwtSecret, (error, decodedToken) => {
    if (error) {
      res.status(401).json({
        msg: "Unauthorized Access!",
      });
    } else {
      res.status(200);
      res.send(decodedToken);
    }
  });
});

router.get("/", middleware, (_req, res) => {
  try {
    let sql = "SELECT * FROM users";
    con.query(sql, (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/:id", (req, res) => {
  try {
    con.query(
      `SELECT * FROM users WHERE id = "${req.params.id}"`,
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
// Edit
router.put('/:id', bodyParser.json(), async(req, res)=>{
  const body = req.body
  const edit = `
      UPDATE users
      SET fullname = ?, email = ?, phonenumber = ?, password = ?
      WHERE id = ${req.params.id}
  `

  let generateSalt = await bcrypt.genSalt()
  body.password = await bcrypt.hash(body.password, generateSalt)
  db.query(edit, [body.username, body.emailAddress, body.phone_number, body.password], (err, result)=>{
      if (err) throw err
      res.json({
          status: 204,
          msg: 'User has been edited successfully',
          users: result
      })
  })
})

module.exports = router;




/* ----------------------/---------------------/------------------- CART ---------------------------\------------------------\------------------ */
// GET CART PRODUCTS
// router.get('/users/:id/cart', (req, res)=>{
//   const cartQ = `
//       SELECT cart FROM users 
//       WHERE id = ${req.params.id}
//   `

//   con.query(cartQ, (err, results)=>{
//       if (err) throw err

//       if (results[0].cart !== null) {
//           res.json({
//               status: 200,
//               cart: JSON.parse(results[0].cart)
//           }) 
//       } else {
//           res.json({
//               status: 404,
//               message: 'There is no items in your cart',
//               users: results
//           })
//       }
//   })
// })
router.get("/users/:id/cart", middleware, (req, res) => {
  try {
    const strQuery = "SELECT cart FROM users WHERE id = ?";
    con.query(strQuery, [req.user.id], (err, results) => {
      if (err) throw err;
      (function Check(a, b) {
        a = parseInt(req.user.id);
        b = parseInt(req.params.id);
        if (a === b) {
          // res.json({
          //   status: 200,
          //   result: results,
          // });
          res.send(results[0].cart);
        } else {
          res.json({
            msg: "Please Login",
          });
        }
      })();
    });
  } catch (error) {
    throw error;
  }
});

// ADD PRODUCT TO CART
router.post('/users/:id/cart', bodyParser.json(),(req, res)=>{
  let bd = req.body
  const cartQ = `
      SELECT cart FROM users 
      WHERE id = ${req.params.id}
  `

  con.query(cartQ, (err, results)=>{
      if (err) throw err
      if (results.length > 0) {
          let cart;
          if (results[0].cart == null) {
              cart = []
          } else {
              cart = JSON.parse(results[0].cart)
          }
          let product = {
              "cart_id" : cart.length + 1,
              "title" : bd.title,
              "category" : bd.category,
              "description" : bd.description,
              "image" : bd.image,
              "price" : bd.price,
              "created_by" : bd.created_by
          }
          cart.push(product);
          const query = `
              UPDATE users
              SET cart = ?
              WHERE id = ${req.params.id}
          `

          db.query(query , JSON.stringify(cart), (err, results)=>{
              if (err) throw err
              res.json({
                  status: 200,
                  results: 'Product successfully added into cart',
                  users: results
              })
          })
      } else {
          res.json({
              status: 404,
              results: 'There is no user with that id'
          })
      }
  })
})

// DELETE CART
router.delete('/users/:id/cart', (req,res)=>{
  const delCart = `
      SELECT cart FROM users 
      WHERE id = ${req.params.id}
  `
  db.query(delCart, (err,results)=>{
      if(err) throw err;
      if(results.length >0){
          const query = `
              UPDATE users 
              SET cart = null 
              WHERE id = ${req.params.id}
          `
          con.query(query,(err,results)=>{
              if(err) throw err
              res.json({
                  status:200,
                  results: `Successfully cleared the cart`,
                  users: results
              })
          });
      }else{
          res.json({
              status:400,
              result: `There is no user with that ID`
          });
      }
  })
})

router.delete('/users/:id/cart/:cartId', (req,res)=>{
      const delSingleCartProd = `
          SELECT cart FROM users 
          WHERE id = ${req.params.id}
      `
      con.query(delSingleCartProd, (err,results)=>{
          if(err) throw err;

          if(results.length > 0){
              if(results[0].cart != null){

                  const result = JSON.parse(results[0].cart).filter((cart)=>{
                      return cart.cart_id != req.params.cartId;
                  })
                  result.forEach((cart,i) => {
                      cart.cart_id = i + 1
                  });
                  const query = `
                      UPDATE users 
                      SET cart = ? 
                      WHERE id = ${req.params.id}
                  `

                  con.query(query, [JSON.stringify(result)], (err,results)=>{
                      if(err) throw err;
                      res.json({
                          status:200,
                          result: "Successfully deleted the selected item from cart",
                          users: results
                      });
                  })

              }else{
                  res.json({
                      status:400,
                      result: "This user has an empty cart"
                  })
              }
          }else{
              res.json({
                  status:400,
                  result: "There is no user with that id"
              });
          }
      })

})
