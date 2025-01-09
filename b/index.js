const express = require("express");
const cors = require("cors");
require('./db/config');
const User = require("./db/User");
const Product = require("./db/Product");
const app = express();
const jwt = require('jsonwebtoken');
const jwtkey = 'e-comm';

app.use(express.json());
app.use(cors());

app.post("/signup", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save()
    result = result.toObject();
    delete result.password;
    if (user) {
        jwt.sign({ user }, jwtkey, (err, token) => {
            if (err) {
                resp.send({ result: 'somthing went wrong' })
            }
            resp.send({ result, token })
        })
    }
});

app.post("/login", async (req, resp) => {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
        jwt.sign({ user }, jwtkey, (err, token) => {
            if (err) {
                resp.send({ result: 'somthing went wrong' })
            }
            resp.send({ user, token })
        })

    } else {
        resp.send({ result: 'no user found' })
    }
});

app.post("/add-product",verifytoken, async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result)
});

app.get("/products",verifytoken, async (req, resp) => {
    try {
        let products = await Product.find();
        if (products.length > 0) {
            resp.send(products)
        } else {
            resp.send({ result: "No Result found" })
        }
    }catch(error){
        resp.status(500).send({ result: "Internal server error" });
    }
  
});

app.delete("/product/:id",verifytoken, async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id })
    resp.send(result);
});

app.get("/product/:id",verifytoken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result)
    } else {
        resp.send("no data found")
    }
})

app.put("/product/:id",verifytoken, async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id.trim() },
        {
            $set: req.body
        }
    )
    resp.send(result);
});

app.get("/search/:key", verifytoken, async (req, resp) => {
    try {
        const result = await Product.find({
            "$or": [
                { name: { $regex: req.params.key, $options: "i" } }, // Case-insensitive
                { type: { $regex: req.params.key, $options: "i" } }
            ]
        });

        if (result.length > 0) {
            resp.send(result);
        } else {
            resp.send({ result: "No matching products found" });
        }
    } catch (error) {
        console.error("Error in /search/:key:", error);
        resp.status(500).send({ result: "Internal server error" });
    }
});


function verifytoken(req,resp,next){
    let token = req.headers['authorization'];
    if(token){
            token =token.split(' ')[1]  ; 
            console.warn("middle ware call",token)
            jwt.verify(token,jwtkey,(err,valid) => {
                if(err){
                    resp.send({result : "please provide valid token with header"})
                }else{
                    next();
                }
            })  
    }else{
        resp.send({result : "please add token with header"})
    }
 
}

app.listen(7000);
