require('dotenv').config();
const db = require('./config/dbconn')
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
const router = express.Router()

app.set('Port', process.env.PORT)

app.use(express.static('view'))
app.use((req, res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', ],
    credentials: true
}));
app.use(router, express.json(), bodyParser.urlencoded({ extended: true }));

app.listen(app.get('Port'), ()=>{console.log(`Server is running on port ${app.get('Port')}`);})


// First Page
app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/views/index.html')
})

// Products

// All Products
router.get('/products', (req, res)=>{
    const getAll = `
        SELECT * FROM products
    `

    db.query(getAll, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            products: results
        })
    })
})


// Single Product
router.get('/products/:id', (req, res)=>{
    const getSingle = `
        SELECT * FROM products WHERE id = ${req.params.id}
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            products: results
        })
    })
})


// Edit Products
router.put('/products/:id', bodyParser.json(),(req, res)=>{
    const edit = `
       UPDATE products
       SET brand = ?, Model = ?, description = ?, price = ?, img = ?, category = ?
       WHERE id = ${req.params.id}
    `

    db.query(edit, [req.body.brand, req.body.Model, req.body.description, req.body.price, req.body.img, req.body.category], (err, results)=>{
        if (err) throw err
        if (req.params.id > 5) {
            res.json({
                status: 404,
                msg: 'Product has been edited successfully',
                results: results
            })
        }
    })
})
/******************************************************************************************************************************** */
router.post("/products", bodyParser.json(), (req, res) => {
    try {
      const strQry = `INSERT INTO products (brand, Model, img, description, category, price) VALUES (? , ? , ? , ? , ? , ?);`;
  
      const products = {
        brand: req.body.brand,
        Model: req.body.Model,
        img: req.body.img,
        description: req.body.description,
        category: req.body.category,
        price: req.body.price,
      };
  
      db.query(
        strQry,
        [
          products.brand,
          products.Model,
          products.img,
          products.description,
          products.category,
          products.price,
        ],
        (err, results) => {
          if (err) throw err;
  
          res.json({
            results: results,
            msg: "item has been Added",
          });
        }
      );
    } catch (error) {
      res.status(400).json({
        error
      });
    }
  });
  
/**************************************************************************************** */
router.delete('/products/:id', (req, res)=>{
    const deleteUser = `
        DELETE FROM products WHERE id = ${req.params.id}`;

    db.query(deleteUser, (err, results)=>{
        if (err) throw err
        res.json({
            status: 204,
            msg: 'Product Deleted Successfully',
            deleteUser: results
        })
    })
})


// Users
// All Users
router.get('/users', (req, res)=>{
    const getAll = `
        SELECT * FROM users
    `

    db.query(getAll, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            users: results
        })
    })
})
// Single User
router.get('/users/:id', (req, res)=>{
    const getSingle = `
        SELECT * FROM users WHERE id = ${req.params.id}
    `

    db.query(getSingle, (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            user: results
        })
    })
})

// Register User
router.post('/users', bodyParser.json(), (req, res)=>{
    const body = req.body;
    if (body.userRole === null || body.userRole === undefined || body.userRole.length === 0){
        body.userRole = "user";
    }
    const email = `
        SELECT * FROM users WHERE email = ?
    `

    let emailC = {
        email: body.email
    }
    db.query(email, emailC ,async(err ,results)=>{
        if (err) throw err
        if (results.length > 0) {
            res.json({
                status: 400,
                msg: 'The provided email already exists'
            })
        } else {
            let generateSalt = await bcrypt.genSalt()
            body.password = await bcrypt.hash(body.password, generateSalt)
            body.dateJoined = new Date().toISOString().slice(0, 10)

            const add = `
                INSERT INTO users(fullname, email,password, phonenumber,userRole,dateJoined,cart)
                VALUES(?, ?, ?, ?, ?, ?, ?)
            `

            db.query(add, [body.fullname, body.email,body.password , body.phonenumber,body.userRole, body.dateJoined, body.cart ], (err, results)=>{
                if (err) throw err
                res.json({
                    status: 204,
                    msg: 'Registration Successful'
                })
            })
        }
    })
})


// Login User
router.post('/users/login', bodyParser.json(), (req, res)=>{
    const {email, password} = req.body
    const login = `SELECT * FROM users WHERE email = '${email}'`;;
    db.query(login, async(err, results)=>{
        if (err) {
            res.status(400).json({
                err: err
            })
        }else {
            if (results.length === 0 || results === null || 
                results === undefined) {
                res.json({
                    status: 400,
                    msg: 'Email Not Found'
                })
            } else {
                if (await bcrypt.compare(password, results[0].password) == false) {
                    res.json({
                        status: 404,
                        msg: 'Password is Incorrect'
                    })
                } else {
                    console.log(results[0]);
                    const payload = {
                        user: {
                            fullname: results[0].fullname,
                            email: results[0].email,
                            password: results[0].password,
                            phonenumber: results[0].phonenumber,
                            userRole: results[0].userRole,
                            dateJoined: results[0].dateJoined,
                            cart: results[0].cart
                        }
                    };
    
                    jwt.sign(payload, process.env.tokenkey, {expiresIn: "7d"}, (err, token)=>{
                        if (err) throw err
                        res.json({
                            status: 200,
                            user: results,
                            token: token
                        })
                    })
                }
            }
        }
    })
})


// Delete User
router.delete('/users/:id', (req, res)=>{
    const deleteUser = `
        DELETE FROM users WHERE id = ${req.params.id};
        ALTER TABLE users AUTO_INCREMENT = 1;
    `

    db.query(deleteUser, (err, results)=>{
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User Deleted Successfully'
        })
    })
})


// Edit User
router.put('/users/:id', bodyParser.json(), async(req, res)=>{
    const body = req.body
    const edit = `
        UPDATE users
        SET fullname = ?, email = ?,password = ? , phonenumber = ?, userRole = ?, dateJoined = ? , cart = ?
        WHERE id = ${req.params.id}
    `

    let generateSalt = await bcrypt.genSalt()
    body.password = await bcrypt.hash(body.password, generateSalt)
    db.query(edit, [body.fullname, body.email,body.password , body.phonenumber, body.userRole , body.dateJoined , body.cart ], (err, results)=>{
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User has been edited successfully'
        })
    })
})




// Cart
// Get Cart
router.get('/users/:id/cart', (req, res)=>{
    const favouritesQ = `
        SELECT cart FROM users 
        WHERE id = ${req.params.id}
    `
    db.query(favouritesQ, (err, results)=>{
        if (err) throw err
        if (results.length > 0) {
            if (results[0].cart != null) {
                res.json({
                    status: 200,
                    // cart: (results[0].cart)
                    cart: JSON.parse(results[0].cart)
                }) 
            } else {
                res.json({
                    status: 404,
                    message: 'There is no items in cart'
                })
            }
        } else {
            res.json({
                status: 404,
                message: 'There is no items in cart'
            })
        }
    })
})


// Add to Cart
router.post('/users/:id/cart', bodyParser.json(),(req, res)=>{
    let bd = req.body
    const favouritesQ = `
        SELECT cart FROM users 
        WHERE id = ${req.params.id}
    `

    db.query(favouritesQ, (err, results)=>{
        if (err) throw err
        if (results.length > 0) {
            let cart;
            if (results[0].cart == null) {
                cart = []
            } else {
                cart = JSON.parse(results[0].cart)
            }
            let added = {
                "id" : cart.length + 1,
                "brand": bd.brand,
                "Model": bd.Model,
                "category": bd.category,
                "description": bd.description,
                "img": bd.img,
                "price": bd.price
            }
            cart.push(added);
            const query = `
                UPDATE users
                SET cart = ?
                WHERE id = ${req.params.id}
            `

            db.query(query , JSON.stringify(cart), (err, results)=>{
                if (err) throw err
                res.json({
                    status: 200,
                    results: 'Item succefully added to cart'
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

// Delete from cart
router.delete('/users/:id/cart', (req,res)=>{
    const delfavourites = `
        SELECT cart FROM users 
        WHERE id = ${req.params.id}
    `
    db.query(delfavourites, (err,results)=>{
        if(err) throw err;
        if(results.length >0){
            const query = `
                UPDATE users 
                SET cart = null 
                WHERE id = ${req.params.id}
            `
            db.query(query,(err,results)=>{
                if(err) throw err
                res.json({
                    status:200,
                    results: `Successfully cleared the cart`,
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

router.delete('/users/:id/cart/:itemid', (req,res)=>{
        const delSinglefavouritesProd = `
            SELECT cart FROM users 
            WHERE id = ${req.params.id}
        `
        db.query(delSinglefavouritesProd, (err,results)=>{
            if(err) throw err;

            if(results.length > 0){
                if(results[0].cart != null){

                    const result = JSON.parse(results[0].cart).filter((cart)=>{
                        return cart.id != req.params.itemid;
                    })
                    result.forEach((cart,i) => {
                        cart.id = i + 1
                    });
                    const query = `
                        UPDATE users 
                        SET cart = ? 
                        WHERE id = ${req.params.id}
                    `

                    db.query(query, [JSON.stringify(result)], (err,results)=>{
                        if(err) throw err;
                        res.json({
                            status:200,
                            result: "Successfully deleted the selected item from the cart"
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

app.use((req, res)=>{
    res.sendFile(__dirname + '/views/404.html')
})