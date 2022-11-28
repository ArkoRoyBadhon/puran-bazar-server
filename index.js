const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000


const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express()
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.et115mk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded
        next();
    })
}

async function run() {
    try {
        const fridgeCollection = client.db('puranaBazar').collection('AllFridge')
        const usersCollection = client.db('puranaBazar').collection('users')
        const advertiseCollection = client.db('puranaBazar').collection('advertise')
        const reportCollection = client.db('puranaBazar').collection('reportList')
        const bookingsCollection = client.db('puranaBazar').collection('bookings')
        const paymentsCollection = client.db('puranaBazar').collection('payments')


        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })


        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            console.log(user);
            res.status(403).send({ accessToken: '' })
        })

        app.get('/category/:id', async (req, res) => {
            const ID = req.params.id;
            const intId = parseInt(ID)
            let query;
            if (intId === 4) {
                query = { stock: 'available' }
            }
            else {
                query = { category: intId, stock: 'available' }
            }
            const allFridge = await fridgeCollection.find(query).toArray();
            res.send(allFridge);
        })

        app.post('/addItem', verifyJWT, async (req, res) => {
            const item = req.body;
            // const query = {}
            const result = await fridgeCollection.insertOne(item)
            // console.log(result);
        })

        app.get('/myproducts', async (req, res) => {
            const email = req.query.email
            const query = { sellerEmail: email }
            const result = await fridgeCollection.find(query).toArray();
            res.send(result);
        })


        app.post('/advertisementpost', verifyJWT, async (req, res) => {
            const data = req.body;
            // console.log(data._id);
            const respp = await advertiseCollection.find({ _id: { $eq: data._id } }).toArray();
            if (respp.length > 0) {
                const message = `Already added`
                return res.send({ acknowledged: false, message })
            }
            const total = await advertiseCollection.insertOne(data);
            res.send(total);

        })
        app.delete('/advertiseDelete', async (req, res) => {
            const id = req.query.id
            const filter = { _id: id }
            const total = await advertiseCollection.deleteOne(filter);
            res.send(total);

        })

        app.get('/getadvertisement', async (req, res) => {
            const query = {};
            const result = await advertiseCollection.find(query).toArray();
            res.send(result);
        })





        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = {
                email: user.email
            }
            const alreadyAdd = await usersCollection.find(query).toArray();
            // console.log(alreadyAdd);
            if (alreadyAdd.length > 0) {
                const message = `Already added`
                return res.send({ acknowledged: false, message })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.patch('/usersverify', verifyJWT, async (req, res) => {
            const email = req.query.email;
            console.log(email);
            const filter = {
                sellerEmail: email
            }
            const updatedDoc = {
                $set: {
                    verify_user: "true"
                }
            }
            const result = await fridgeCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })
        app.patch('/fridgestock', async (req, res) => {
            const id = req.query.id;
            console.log(id);
            const filter = {
                _id: ObjectId(id)
            }
            const updatedDoc = {
                $set: {
                    stock: "sold"
                }
            }
            const result = await fridgeCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.get('/users', async (req, res) => {
            const emailQ = req.query.email
            // console.log(emailQ);
            // const options = { upsert: true }
            const query = { email: emailQ }
            const total = await usersCollection.findOne(query)
            // console.log(total);
            res.send(total);
        })

        app.get('/allbuyers', verifyJWT, async (req, res) => {
            const filter = { role: "Buyer" }
            const result = await usersCollection.find(filter).toArray()
            console.log(result);
            res.send(result);
        })

        app.delete('/buyerDelete', verifyJWT, async (req, res) => {
            const id = req.query.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result);
        })

        app.post('/report', verifyJWT, async (req, res) => {
            const data = req.body;
            console.log(data._id);
            const respp = await reportCollection.find({ _id: { $eq: data._id } }).toArray();
            if (respp.length > 0) {
                const message = `Already added`
                return res.send({ acknowledged: false, message })
            }
            const result = await reportCollection.insertOne(data)
            res.send(result)
        })
        app.get('/report', verifyJWT, async (req, res) => {
            const query = {}
            const result = await reportCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/fridgedelete', verifyJWT, async (req, res) => {
            const id = req.query.id;
            // console.log(id);
            const filter = { _id: ObjectId(id) }
            const total = await fridgeCollection.deleteOne(filter);
            // const result = await reportCollection.deleteOne(filter);
            res.send(total);
        })
        app.delete('/reportdelete', verifyJWT, async (req, res) => {
            const id = req.query.id;
            // console.log(id);
            const filter = { _id: id }
            // const total = await fridgeCollection.deleteOne(filter);
            const result = await reportCollection.deleteOne(filter);
            res.send(result);
        })


        app.get('/allsellers', verifyJWT, async (req, res) => {
            const filter = { role: "Seller" }
            const result = await usersCollection.find(filter).toArray()
            res.send(result);
        })

        app.delete('/sellerDelete', verifyJWT, async (req, res) => {
            const id = req.query.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result);
        })

        app.patch('/sellerVerify', verifyJWT, async (req, res) => {
            const id = req.query.id;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    verify: "true"
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.get('/currentusers', async (req, res) => {
            const email = req.query.email
            // console.log(email);
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })

        app.post('/bookings', verifyJWT, async (req, res) => {
            const info = req.body;
            console.log(info);
            const query = {}
            const result = await bookingsCollection.insertOne(info);
            res.send(result);
        })

        app.get('/bookings', verifyJWT, async (req, res) => {
            // const decodedEmail = req.decoded.email;
            // const query = {email: decodedEmail}
            // const user = await usersCollection.findOne(query);
            // if(user?.role !== 'Buyer'){
            //     return res.status(403).send({message: 'forbidden access'})
            // }

            const email = req.query.email;
            const filter = { email: email }
            const result = await bookingsCollection.find(filter).toArray();
            res.send(result);
        })

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })
    }
    finally {

    }
}
run().catch(console.log())


app.get('/', (req, res) => {
    res.send("purana-bazar server is running")
})

app.listen(port, () => {
    console.log(`server is running on ${port}`);
})
