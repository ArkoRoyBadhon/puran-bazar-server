const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000


const app = express()
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.et115mk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        const fridgeCollection = client.db('puranaBazar').collection('AllFridge')
        const usersCollection = client.db('puranaBazar').collection('users')
        const advertiseCollection = client.db('puranaBazar').collection('advertise')
        const reportCollection = client.db('puranaBazar').collection('reportList')

        app.get('/category/:id', async (req, res) => {
            const ID = req.params.id;
            const intId = parseInt(ID)
            let query;
            if (intId === 4) {
                query = {}
            }
            else {
                query = { category: intId }
            }
            const allFridge = await fridgeCollection.find(query).toArray();
            res.send(allFridge);
        })

        app.post('/addItem', async (req, res) => {
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


        app.post('/advertisementpost', async (req, res) => {
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

        app.patch('/usersverify', async (req,res) => {
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

        app.get('/users', async (req, res) => {
            const emailQ = req.query.email
            // console.log(emailQ);
            // const options = { upsert: true }
            const query = { email: emailQ }
            const total = await usersCollection.findOne(query)
            // console.log(total);
            res.send(total);
        })

        app.get('/allbuyers', async (req, res) => {
            const filter = { role: "Buyer" }
            const result = await usersCollection.find(filter).toArray()
            res.send(result);
        })

        app.delete('/buyerDelete', async (req, res) => {
            const id = req.query.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result);
        })

        app.post('/report', async (req, res) => {
            const data = req.body;
            console.log(data._id);
            const respp = await reportCollection.find({ _id: { $eq: data._id } }).toArray();
            if (respp.length > 0) {
                const message = `Already added`
                return res.send({ acknowledged: false, message })
            }
            const result = await reportCollection.insertOne(data)
        })
        app.get('/report', async (req, res) => {
            const query = {}
            const result = await reportCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/fridgedelete', async (req, res) => {
            const id = req.query.id;
            // console.log(id);
            const filter = { _id: ObjectId(id) }
            const total = await fridgeCollection.deleteOne(filter);
            // const result = await reportCollection.deleteOne(filter);
            res.send(total);
        })
        app.delete('/reportdelete', async (req, res) => {
            const id = req.query.id;
            // console.log(id);
            const filter = { _id: id }
            // const total = await fridgeCollection.deleteOne(filter);
            const result = await reportCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/allsellers', async (req, res) => {
            const filter = { role: "Seller" }
            const result = await usersCollection.find(filter).toArray()
            res.send(result);
        })

        app.delete('/sellerDelete', async (req, res) => {
            const id = req.query.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result);
        })

        app.patch('/sellerVerify', async (req, res) => {
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
