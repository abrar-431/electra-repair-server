const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.salgcrv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    const serviceCollection = client.db("serviceDB").collection("services");
    const bookedServiceCollection = client.db("serviceDB").collection("bookedServices");


    app.get('/services', async (req, res) => {
      const email = req.query?.email;
      let query = {};
      if (email) {
        query = { providerEmail: email };
      }
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/searched-services', async(req, res)=>{
      const searchedText = req.query.search;
      const query = {service: {$regex: searchedText, $options: 'i'}}
      const result = await serviceCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/popular-services', async (req, res) => {
      const result = await bookedServiceCollection.aggregate([
        {
          $group: {
              _id: "$id",
              count: { $sum: 1 },
              area: { $first: "$area" },
              image: { $first: "$image" },
              price: { $first: "$price" },
              providerName: { $first: "$name" },
              providerImage: { $first: "$providerImage" },
              service: { $first: "$service" },
          }
      },
      { $sort: { count: -1 } }
    ]).toArray();
      res.send(result);
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    })
    app.post('/services', async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    })
    app.put('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const service = req.body;
      const updateService = {
        $set: {
          service: service.service, 
          area: service.area,
          image: service.image, 
          price: service.price, 
          description: service.description,
        },
      };
      const result = await serviceCollection.updateOne(filter, updateService, options);
      res.send(result);
    })
    app.delete('/services/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await serviceCollection.deleteOne(filter);
      res.send(result);
    })

    // Booked Services
    app.post('/booked-services', async (req, res) => {
      const newService = req.body;
      const result = await bookedServiceCollection.insertOne(newService);
      res.send(result);
    })
    app.get('/booked-services', async(req, res)=>{
      const result = await bookedServiceCollection.find().toArray();
      res.send(result);
    })
    app.patch('/booked-services/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const service = req.body;
      const updateService = {
        $set: {
          serviceStatus: service.status,
        },
      };
      const result = await bookedServiceCollection.updateOne(filter, updateService);
      res.send(result);
    })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
  res.send('Electra Repair Server running');
})

app.listen(port, () => {
  console.log('Electra repair running on port,', port);
})