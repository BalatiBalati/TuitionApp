const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

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
app.use(morgan("short"));
app.use(express.json());

app.param('collectionName', function(req, res, next, collectionName){
    req.collection = db.collection(collectionName);
    return next();
});

app.get('/', function(req, res, next){
    res.send('Select a collection, e.g., /collections/courses');
});

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

app.get('/courses/:max/:sortAspect/:sortOrder', function(req, res, next){
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

app.get('/collections/:collectionName/:id', function(req, res, next){
    try {
        const objectId = new ObjectId(req.params.id);
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

app.all("/collections/courses", function(req, res){
    res.send("The service has been called correctly and it is working");
    res.json({ result: "OK" });
});

app.post("/", function(req, res){
    res.send("a POST request? Let's create a new element");
});

app.put("/", function(req, res){
    res.send("OK, let's change an element");
});

app.delete("/", function(req, res){
    res.send("Are you sure? Ok, let's delete a record");
});

app.use(function(req, res, next){
    console.log("Incoming request", req.url);
    next();
});

app.use(function(req, res){
    res.status(404).send("Resource not found!");
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
