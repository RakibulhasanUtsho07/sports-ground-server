const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

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
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = header.split(" ")[1];
  console.log(token, "token");
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload.user || payload;
    next();
  } catch (error) {
    console.log("JWT Verification Details Error:", error.message);
    return res.status(403).json({ message: "forbidden" });
  }
};
async function run() {
  try {
    // await client.connect();
    const db = client.db("matchday");
    const groundCollection = db.collection("grounds");
    const bookingsCollection = db.collection("bookings");

    app.get("/grounds", async (req, res) => {
      try {
        const result = await groundCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({ message: "Server error occurred" });
      }
    });
    app.get("/bookings", verifyToken, async (req, res) => {
      try {
        const loggedInUserId = req.user?.id || req.user?._id;
        console.log(loggedInUserId,"hi");

        if (!loggedInUserId) {
          return res
            .status(401)
            .send({
              message: "Unauthorized: User identity could not be verified",
            });
        }

        const query = {
          userId: loggedInUserId,
        };
        const result = await bookingsCollection.find(query).toArray();
        res.json(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({ message: "Server error occurred" });
      }
    });

    app.patch("/grounds/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      console.log(updatedData)
      
      const result = await groundCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.json(result);
    });
    app.post("/grounds", async (req, res) => {
      const ground = req.body;
      console.log(ground, "form data")
      const result = await groundCollection.insertOne(ground);
      console.log(ground);
      res.send(result);
    });
    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;
        const isExist = await bookingsCollection.findOne({
          userId: booking.userId,
          groundId: booking.groundId,
        });
        if (isExist) {
          return res.status(400).json({
            success: false,
            message: "The ground is already exist on bookings",
          });
        }

        const result = await bookingsCollection.insertOne(booking);
        res.status(201).json({ success: true, ...result });
      } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    app.delete("/bookings/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid Booking ID format" });
        }
        const result = await bookingsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.json(result);
      } catch (error) {
        console.error("Database Delete Error:", error);
        res
          .status(500)
          .json({ error: "Internal Server Error", details: error.message });
      }
    });
    app.get("/grounds/:id", verifyToken, async (req, res) => {
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

    // await client.db("admin").command({ ping: 1 });
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
