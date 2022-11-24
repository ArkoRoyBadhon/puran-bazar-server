const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        app.get('/category/:id', async (req,res) => {
            const ID = req.params.id;
            if(ID === 4) {
                const query = {}
            } else {
                const query = {_id: ID}
            }
            const query = {}
            
            const allFridge = await fridgeCollection.find(query).toArray();
            res.send(allFridge);
        })

    }
    finally {

    }
}
run().catch(console.log())


app.get('/', (req,res)=> {
    res.send("purana-bazar server is running")
})

app.listen(port, ()=> {
    console.log(`server is running on ${port}`);
})
