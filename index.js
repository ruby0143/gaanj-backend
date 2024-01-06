var express = require('express');
var cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const products = require('./products')

const mongoUrl = `mongodb+srv://ruby07:8074662205s@cluster0.97u8x.mongodb.net/gaanjUsers`

mongoose.connect(mongoUrl, { useNewUrlParser: true });

const userSchema = {
    uid: String,
    email: String,
    firstName: String,
    lastName: String,
    mobile: String,
    address: String
}

const cartSchema = {
    uid: String,
    cartItems: Array
}


const productSchema = {
    id: String,
    price: Number,
    header: Object,
    about: Object,
    useCases: Object,
    testimonials: Array
}

const Users = new mongoose.model("User", userSchema);
const Products = new mongoose.model("Product", productSchema);
const Cart = new mongoose.model("Cart", cartSchema);


let app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.post("/getUser", (req, res) => {
    let userid = req.body.uid;
    Users.findOne({ uid: userid })
        .then(resp => {
            console.log(resp, userid, "backend")
            res.status(200).json({ message: resp })
        })
        .catch(err => [
            res.status(500).json({ message: err })
        ])
})
app.post("/updateUser", (req, res) => {
    const body = req.body;
    console.log(body, "printing...")
    const userid = body.uid;
    const firstName = body.firstName;
    let lastName = body.lastName;
    let mobile = body.mobile;
    let address = body.address;
    Users.updateOne({ uid: userid }, {
        $set: {
            firstName: firstName,
            lastName: lastName,
            mobile: mobile,
            address: address
        }
    })
        .then(resp => {
            res.status(200).json({ message: resp })
        })
        .catch(err => {
            console.log(err);
        })
})

app.post("/addToCart", (req, res) => {
    const pid = req.body.pid;
    const uid = req.body.uid;
    const pdata = products.products[pid - 1];
    let currentCart = [];

    Cart.findOne({ uid: uid })
        .then(resp => {
            currentCart = resp.cartItems;
            let flag = 0;
            console.log(currentCart, "printing")
            currentCart.forEach((ele, idx) => {
                if (ele.pid === pid) {
                    ele.quantity = ele.quantity + 1;
                    flag = 1;
                    // console.log(ele, 'printing inside loop');
                }

            })
            if (flag === 0) {
                const newProduct = {
                    pid: pid,
                    quantity: 1,
                    title: pdata.header.title,
                    image: pdata.header.image,
                    price: pdata.price
                }
                currentCart.push(newProduct);
            }
            Cart.updateOne({ uid: uid }, {
                $set: {
                    cartItems: currentCart
                }
            })
                .then(resp => {
                    console.log("Successfully added to cart", resp)
                    res.send(resp);
                })
                .catch(err => {
                    console.log(err);
                    res.send(err);
                });
            console.log(currentCart);
        })

})
app.post("/getCart", (req, res) => {
    const uid = req.body.uid;

    Cart.findOne({ uid: uid })
        .then(resp => {
            let cartTotal = 0;
            let cart = resp.cartItems;
            cart.forEach((ele,idx)=>{
                cartTotal = cartTotal + (ele.quantity*ele.price);
            })
            // console.log(cartTotal,'pr')
            res.status(200).json({ message: resp, total : cartTotal })
        })
        .catch(err => {
            console.log(err);
        })
})


app.post("/deleteFromCart", (req, res) => {
    const pid = req.body.pid;
    const uid = req.body.uid;
    const del =  req.body.delete;
    let currentCart = [];
    let temp = [];
    Cart.findOne({ uid: uid })
        .then(resp => {
            currentCart = resp.cartItems;
            currentCart.forEach((ele) => {
                console.log(ele,pid,"check");
                if (ele.pid === pid) {
                    
                    ele.quantity = ele.quantity - 1;
                    if(ele.quantity === 0 || del){
                        temp = currentCart.filter((elem)=>{
                            return elem.pid != ele.pid;
                        })
                        currentCart = temp;
                    }
                }
                
            })
            console.log(currentCart,"backend");
            Cart.updateOne({ uid: uid }, {
                $set: {
                    cartItems: currentCart
                }
            })
                .then(resp => {
                    console.log("Successfully added to cart", resp)
                })
                .catch(err => console.log(err));
        })

})


app.post("/users", (req, res) => {
    let userid = req.body.uid;
    let email = req.body.email;
    console.log(userid, email);

    Users.findOne({ uid: userid })
        .then(resp => {
            if (resp == undefined) {
                const User = new Users({
                    uid: userid,
                    email: email,
                    firstName: null,
                    lastName: null,
                    mobile: null,
                    address: null
                })

                const cart = new Cart({
                    uid: userid,
                    cartItems: []
                })
                cart.save().then(resp => console.log(resp));
                User.save().then(doc => res.status(200).json({ message: doc }));
            }
            else {
                res.status(200).json({ message: resp })
            }
        })
        .catch(err => {
            console.log(err);
        })

})


app.get("/products", (req, res) => {
    res.status(200).json({ message: products });
})




app.get("/", (req, res) => {

    res.send("ok");

})


app.listen(3000 || process.env.PORT, function () {
    console.log("Server started on port 3000");
});
