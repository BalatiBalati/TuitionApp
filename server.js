const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "demo-db.properties");
let properties = propertiesReader(propertiesPath);

let dbPrefix = properties.get("db.prefix");
let dbUsername = properties.get("db.user");
let dbPwd = encodeURIComponent(properties.get("db.password"));  // Encode the password to handle special characters
let dbName = properties.get("db.dbname");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

// Create the MongoDB connection string using the provided details.
// Ensure the database name and parameters are included in the URI.
const uri = `${dbPrefix}${dbUsername}:${dbPwd}${dbUrl}${dbName}${dbParams}`;

let db;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

client.connect(err => {
    if (err) {
        console.error("Failed to connect to the database", err);
        return;
    }
    db = client.db(dbName);  // Use the database name from the properties
    console.log("Connected to database", dbName);
});

let app = express();
app.set('json spaces', 3);

app.use(cors());
//app.options('*', cors());
app.use(morgan("short"));
app.use(express.json());
//app.use(bodyParser.json);

app.param('collectionName', function(req, res, next, collectionName){
    req.collection = db.collection(collectionName);
    return next();
});

app.get('/', function(req, res, next){
    res.send('Select a collection, e.g., /collections/courses');
});

// Route to fetch all records from a collection
app.get('/courses', async function(req, res, next){
    try {
        const database = client.db('EdTech');
        const items = await database.collection('courses').find({}).toArray();
        res.json(items);
        //db = client.db('EdTech');  // Connect to the 'EdTech' database
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to fetch records from a collection with limit, sorting, and ordering
app.get('/collections/:collectionName/:max/:sortAspect/:sortOrder', function(req, res, next){
    const max = parseInt(req.params.max, 10);
    const sortDirection = req.params.sortOrder === "desc" ? -1 : 1;

    req.collection.find({})
        .limit(max)
        .sort([[req.params.sortAspect, sortDirection]])
        .toArray(function(err, results){
            if (err) {
                return next(err);
            }
            res.json(results);
        });
});

// Route to fetch a single record by ID
app.get('/collections/:collectionName/:id', function(req, res, next){
    try {
        const objectId = new ObjectId(req.params.id);  // Correctly handle ObjectId
        req.collection.findOne({ _id: objectId }, function(err, result){
            if (err) {
                return next(err);
            }
            if (!result) {
                return res.status(404).send("Record not found");
            }
            res.json(result);
        });
    } catch (e) {
        return res.status(400).send("Invalid ID format");
    }
});

// Route to handle POST request for creating a new record in the collection

app.post('/UserData', async (req, res) => {
    try{
        const database = client.db("EdTech");
        const order = database.collection("UserData");
        const result = await order.insertOne(req.body);
        res.json(result);
        console.log("Posted a new order");
    } catch(error){
        res.status(500).json({ error: 'Failed to create order' });
        // process.exit(1);
    }
});
// app.post('/UserData', function(req, res, next){
    
//     const database = client.db('EdTech');
//     const newUser = req.body;
//     res.send(newUser);

//     // if (!newUser.name || !newUser.phone) {
//     //     return res.status(400).json({ message: "Name and Phone are required" });
//     // }

//     database.collection('UserData').insertOne(newUser, function(err, result){
//         if (err) {
//             return next(err);
//         }
//         res.status(201).json({ message: 'User added successfully' });
//     });
// });

// Route to handle PUT request for updating a record in the collection
app.put('/collections/:collectionName/:id', function(req, res, next){
    try {
        const objectId = new ObjectId(req.params.id);  // Handle ObjectId
        req.collection.updateOne(
            { _id: objectId },
            { $set: req.body },
            function(err, result){
                if (err) {
                    return next(err);
                }
                if (result.modifiedCount === 0) {
                    return res.status(404).send("Record not found");
                }
                res.json({ message: "Record updated successfully" });
            }
        );
    } catch (e) {
        return res.status(400).send("Invalid ID format");
    }
});

// Route to handle DELETE request for removing a record from the collection
app.delete('/collections/:collectionName/:id', function(req, res, next){
    try {
        const objectId = new ObjectId(req.params.id);  // Handle ObjectId
        req.collection.deleteOne({ _id: objectId }, function(err, result){
            if (err) {
                return next(err);
            }
            if (result.deletedCount === 0) {
                return res.status(404).send("Record not found");
            }
            res.json({ message: "Record deleted successfully" });
        });
    } catch (e) {
        return res.status(400).send("Invalid ID format");
    }
});

// Catch-all for logging incoming requests
app.use(function(req, res, next){
    console.log("Incoming request", req.url);
    next();
});

// Catch-all for handling 404 errors
app.use(function(req, res){
    res.status(404).send("Resource not found!");
});

// Start the server
app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
