const express = require("express")
const dotenv = require("dotenv")

const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
PORT= process.env.PORT
dotenv.config()
app.get("/", (req, res )=>{
    res.send("Server is running")
})

const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, ()=>{
    console.log(`Server running on  port ${PORT}`)
})