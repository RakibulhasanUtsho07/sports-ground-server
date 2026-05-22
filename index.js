const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());
dotenv.config();
PORT = process.env.PORT;
const uri = process.env.MONGODB_URI;
app.get("/", (req, res) => {
  res.send("Server is running");
});

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    await client.connect();
    const db = client.db("matchday");
    const groundCollection = db.collection("grounds");

    app.get("/grounds", async (req, res) => {
      try {
        const result = await groundCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        
        res.status(500).send({ message: "Server error occurred" });
      }
    });
    // app.post('/grounds', async (req, res)=>{

    // })
    app.patch('/grounds:id', async(req, res)=>{
      const {id} = await req.params
      const updatedData = req.body
      const result = groundCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updatedData}
      )
      res.json()
    })
    app.post('/grounds', async(req, res)=>{
      const ground = req.body
     const result = groundCollection.insertOne(ground)
     console.log(ground)
      res.send(result)
    })
    app.get("/grounds/:id", async (req, res) => {
      try {
        const { id } = await req.params;
        const result = await groundCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({ message: "Server error occurred" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server running on  port ${PORT}`);
});
