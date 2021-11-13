const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const admin = require("firebase-admin");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k92al.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

// console.log(uri);
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


// async function verifyToken(req, res, next) {
//     if (req.headers?.authorization?.startsWith("Bearer ")) {
//         const token = req.headers.authorization.split(" ")[1];

//         try {
//             const decodedUser = await admin.auth().verifyIdToken(token);
//             req.decodedEmail = decodedUser.email;
//         } catch {}
//     }
//     next();
// }

async function run() {
    try {
        await client.connect();
        const database = client.db("brothers-car");
        // const appointmentsCollection = database.collection("appointments");
        const usersCollection = database.collection("users");
        const servicesCollection = database.collection("services");
        const booksCollection = database.collection("books");

        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            console.log("getting specific service", id);
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.json(service);
        });

        app.post("/services", async (req, res) => {
            const service = req.body;
            console.log("hit the api", service);
            const result = await servicesCollection.insertOne(service);
            console.log(result);
            res.json(result);
        });

        // GET book
        app.get("/books", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = booksCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });

        app.post("/books", async (req, res) => {
            const service = req.body;
            // console.log("hit the api", service);
            const orders = await booksCollection.insertOne(service);
            // console.log(orders);
            res.json(orders);
        });

         app.delete("/books/:id", async (req, res) => {
             const id = req.params.id;
             const query = { _id: ObjectId(id) };
             const result = await booksCollection.deleteOne(query);
             console.log("deleting user with id ", result);
             res.json(result);
         });


        // app.get("/appointments", verifyToken, async (req, res) => {
        //     const email = req.query.email;
        //     const date = new Date(req.query.date).toLocaleDateString();
        //     const query = { email: email, date: date };
        //     const cursor = appointmentsCollection.find(query);
        //     const appointments = await cursor.toArray();
        //     res.json(appointments);
        // });

        // app.post("/appointments", async (req, res) => {
        //     const appointment = req.body;
        //     const result = await appointmentsCollection.insertOne(appointment);
        //     console.log(result);
        //     res.json(result);
        // });

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.json(result);
        });

        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            console.log("put", user);
            // const requester = req.decodedEmail;
            // if (requester) {
            //     const requesterAccount = await usersCollection.findOne({
            //         email: requester,
            //     });
            //     if (requesterAccount.role === "admin") {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: "admin" } };
                    const result = await usersCollection.updateOne(
                        filter,
                        updateDoc
                    );
                    res.json(result);
            //     }
            // } else {
            //     res.status(403).json({
            //         message: "you do not have access to make admin",
            //     });
            // }
        });
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Running my Server");
});

app.listen(port, () => {
    console.log("Running Server on port", port);
});
