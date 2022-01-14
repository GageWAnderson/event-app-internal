'use strict';
// Useless comment
// express is a nodejs web server
// https://www.npmjs.com/package/express
const express = require('express');

// Get access to firestore database for events
const { Firestore } = require('@google-cloud/firestore');

// converts content in the request into parameter req.body
// https://www.npmjs.com/package/body-parser
const bodyParser = require('body-parser');

// create the server
const app = express();

// the backend server will parse json, not a form request
app.use(bodyParser.json());

// allow AJAX calls from 3rd party domains
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, MERGE, GET, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Connect to Firestore database, set project ID from env vars
const firestore = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

// Return when firestore returns an empty snapshot
const noEventsYet = {
    events: [
        { title: 'No events yet!', id: 1, description: 'Add an event below.' },
    ]
};

// Return when Firestore call throws an error
const eventError = {
    events: [
        { title: 'ERROR', id: 1, description: 'Firestore could not be contacted' },
    ]
};

function getEvents(req, res) {
    firestore.collection("Events").get().then((snapshot) => {
        if (!snapshot.empty) {
            const ret = { events: [] };
            snapshot.docs.forEach(elem => {
                ret.events.push(elem.data());
            }, this);
            res.json(ret);
        } else {
            res.json(noEventsYet);
        }
    }).catch((err) => {
        res.json(eventError);
    })
};

// health endpoint - returns an empty array
app.get('/', (req, res) => {
    res.json([]);
});

// version endpoint to provide easy convient method to demonstrating tests pass/fail
app.get('/version', (req, res) => {
    res.json({ version: '1.0.0' });
});

// mock events endpoint. this would be replaced by a call to a datastore
// if you went on to develop this as a real application.
app.get('/events', (req, res) => {
    getEvents(req, res);
});

// Adds an event to Firestore database
app.post('/event', (req, res) => {
    // create a new object from the json data and add an id
    const event = {
        title: req.body.title,
        description: req.body.description,
        id: noEventsYet.events.length + 1
    }

    // Create events collection in Firestore if it doesn't yet exist
    // Then get the updated event list back from Firestore
    firestore.collection("Events").add(event).then(ret => {
        getEvents(req, res);
    });
});

app.delete('/event', (req, res) => {
    const event = {
        title: req.body.title,
        description: req.body.description,
        id: req.body.id,
    };

    firestore.collection("Events").delete(event).then(ret => {
        getEvents(req, res);
    }).catch((err) => {
        console.log(`err = ${err}`);
        getEvents(req, res);
    })
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT ? process.env.PORT : 8082;
const server = app.listen(PORT, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log(`Events app listening at http://${host}:${port}`);
});

module.exports = app;