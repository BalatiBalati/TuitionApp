const express = require("express");
const cors = require("cors");

let app = express();
app.set('json spaces', 3);

app.use(cors());

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