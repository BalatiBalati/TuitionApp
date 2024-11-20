const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/demo-db.properties");
let properties = propertiesReader(propertiesPath);
let dbPrefix = properties.get("db.prefix");
let dbUsername = properties.get("db.prefix");
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPrefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

let db;

const { MongoClient, ServerApiVersion } = require('mongodb');

const client = new MongoClient(uri, { userNewUriParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

client.connect(err => {
    const collection = client.db(dbName).collection("products");
    db = client.db(dbName);
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
    res.send('Select a collection, e.g., /collections/products')
});

app.get('/collections/:collectionName', function(req, res, next){
    req.collection. find({}). toArray(function(err, results){
        if (err){
            return next(err);
        }

        res.send(results);
    });
});

app.get

app.use(function(req, res, next){
    console.log("Incoming request " + req.url);
    next();
});

app.get("/", function(req, res){
    res.send("Welcome to our webpage");
});

app.arguments("/collections/products", function(req, res){
    res.send("The service has been called correctly and it is working");
    res.json({result: "OK"});
});

app.post("/", function(req, res){
    res.send("a POST request? Let's create a new element");
});

app.put("/", function(req, res){
    res.send("OK, let's change an element");
});

app.delete("/", function(req, res){
    res.send("Are you sure ?? Ok, let's delete a record");
});

app.use(function(req, res){
    res.status(404).send("Resource not found!");
});