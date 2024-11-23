const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/demo-db.properties");
let properties = propertiesReader(propertiesPath);

let dbPrefix = properties.get("db.prefix");
let dbUsername = properties.get("db.user");
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.name");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPrefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

let db;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

app.get('/collections/:collectionName/:max/:sortAspect/:sertAscDesc', function(req, res, next){
    var max = parseInt(req.params.max, 10);

    let sortDirection = 1;
    if (req.params.sertAscDesc === "desc") {
        sortDirection = -1;
    }

    req.collection.find({}, {limit: max, sort: [[req.params.sortAspect, sortDirection]]}).toArray(function(err, results){
        if (err) {
            return next(err);
        }

        res.send(results);
    });

});

app.get('/collections/:collectionName/:id', function(req, res, next){
    req.collection.findOne({ _id: new ObjectId(req.params.id) }, 
    function(err, results){
        if (err) {
            return next (err);
        }
    });
});

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

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});