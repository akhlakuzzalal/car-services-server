const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const app = express();
const fileUpload = require('express-fileupload');
const stripe = require("stripe")(process.env.STRIPE_SECRETE);


const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json())
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rolps.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
   try {
      await client.connect();
      console.log('connected mongoDB')
      const database = client.db('caeServices')
      const usersCollection = database.collection('users')

      // post a new user
      app.post('/user', async (req, res) => {
         const information = req.body;
         if (req.body.role === 'Rider') {
            const profile = req.files?.profile.data.toString('base64');
            const licence = req.files?.licence.data.toString('base64');
            const nid = req.files?.nid.data.toString('base64');
            const profileBuffer = Buffer.from(profile, 'base64');
            const licencePic = Buffer.from(licence, 'base64');
            const nidPic = Buffer.from(nid, 'base64');
            const doc = {
               email: information.email,
               information: information,
               profilePic: profileBuffer,
               licencePic: licencePic,
               nidPic: nidPic,
            }
            const result = await usersCollection.insertOne(doc);
            res.json(result);
         }
         else {
            const profile = req.files?.profile.data.toString('base64');
            const nid = req.files?.nid.data.toString('base64');
            const profileBuffer = Buffer.from(profile, 'base64');
            const nidPic = Buffer.from(nid, 'base64');
            const doc = {
               email: information.email,
               information: information,
               profilePic: profileBuffer,
               nidPic: nidPic,
            }
            const result = await usersCollection.insertOne(doc);
            res.json(result);
         }
      })

      // get all users
      app.get('/users', async (req, res) => {
         const cursor = usersCollection.find({});
         const allUsers = await cursor.toArray();
         res.json(allUsers);
      })

      // get single user
      app.get('/user/:email', async (req, res) => {
         const email = req.params.email
         const query = { email: email }
         const cursor = await usersCollection.findOne(query)
         res.json(cursor)
      });

      // Stripe BAckend
      app.post("/create-payment-intent", async (req, res) => {
         const items = req.body;
         // Create a PaymentIntent with the order amount and currency
         const paymentIntent = await stripe.paymentIntents.create({
            amount: items.price * 100,
            currency: "usd",
            automatic_payment_methods: {
               enabled: true,
            }
         });

         res.json({ clientSecret: paymentIntent.client_secret });
      });

   } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
   }
}
run().catch(console.dir);


app.get('/', (req, res) => {
   res.send('Hero Rider Server is Running');
});

app.listen(port, () => console.log('Server running', port));