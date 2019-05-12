#! /usr/bin/env node

'use strict';

const program  = require('commander');
const moment   = require('moment');
const Client   = require('mongodb').MongoClient;
const ObjectID = require('bson').ObjectID;
const pkg = require('./package.json');


const URL  = 'mongodb://localhost:27017';
const DB   = 'test';
const COL  = 'collection';
const DATE = moment().format("YYYY-MM-DD");


program
    .version(pkg.version)
    .option('-u, --url <connection> ', `mongo connection url ( defaults: ${URL} )`)
    .option('-d, --database   <name>',  'database to target')
    .option('-c, --collection <name>',  'collection to target')
    .option('-s, --start <startDate>',  `date to process from  ( defaults: ${DATE} )`)
    .option('-e, --end   <endDate>  ',  `date to process until ( defaults: ${DATE} )`)
    .parse(process.argv);


const client = new Client(URL, {useNewUrlParser: true, appName: pkg.name});

client
  .connect()
  .then(() => {

    const database   = client.db(DB);
    const collection = database.collection(COL);
    const start      = new Date(program.start || DATE);
    const end        = new Date(program.end   || DATE);

    const startTime = moment(start, "YYYY-MM-DD").startOf('day').toDate().getTime();
    const endTime   = moment(end,   "YYYY-MM-DD").endOf('day'  ).toDate().getTime();

    const filter = {
      "_id": {
        "$gte": ObjectID.createFromTime(startTime / 1000),
        "$lte": ObjectID.createFromTime(endTime   / 1000)
      }
    };

    return collection.deleteMany(filter)
  })
  .then(doc => {
    const success = doc.result.ok === 1;
    const deleted = doc.result.n;
    console.log(`Success? ${success}`);
    console.log(`Deleted ${deleted} records from ${COL}\n`);
  })
  .catch(err => console.log(err))
  .finally(() => client.close());
