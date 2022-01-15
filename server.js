const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api', bodyParser.urlencoded({extended: false}));

// db
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  name: String
});

const User = mongoose.model('User', userSchema);

function addUser(name, callback) {
  User.create({name: name}, (err, user) => {
    if(err) {
      return console.error(err);
    }
    callback(user.name, user.id)
  })
}

function getUsers(callback) {
  User.find({}, (err, users) => {
    if(err) {
      return console.error(err);
    }
    callback(users);
  })
}

const exerciseSchema = new mongoose.Schema({
  user: String,
  description: String,
  duration: Number,
  date: Date
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

function addExercise(id, desc, dur, date, callback, errcallback) {
  User.findOne({_id: id}, (err, user) => {
    if(err) {
      console.error(err);
      return errcallback();
    }
    if(!user) {
      console.error('No user found', id)
      return errcallback();
    }
    Exercise.create({user: id, description: desc, duration: dur, date: date}, (err, ex) => {
      if(err) {
        console.error(err);
        return errcallback();
      }
      callback(ex.user, user.name, ex.description, ex.duration, ex.date);
    });
  });
}

function getExcercises(id, start, end, limit, callback) {
  User.findOne({_id: id}, (err, user) => {
    if(err) {
      return console.error(err);
    }
    let exQuery = Exercise.find({user: id})
    if(start.toDateString() !== 'Invalid Date') {
      exQuery = exQuery.where('date').gt(start)
    }
    if(end.toDateString() !== 'Invalid Date') {
      exQuery = exQuery.where('date').lt(end)
    }
    if(limit) {
      exQuery = exQuery.limit(limit)
    }
    exQuery.exec((err, logs) => {
      if(err) {
        console.error(err)
      }
      callback(user.name, logs);
    });
  });
}


// endpoints
app.post('/api/users', (req, res) => {
  const name = req.body.username;
  addUser(name, (userName, userId) => {
    res.json({username: userName, _id: userId});
  });
});

app.get('/api/users', (req, res) => {
  getUsers((users) => {
    res.json(users.map(function(user) {return{username: user.name, _id: user.id}}));
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params['_id'];
  const description = req.body.description;
  const duration = Number(req.body.duration);
  let date = new Date(req.body.date);
  if(date.toDateString() === 'Invalid Date') {
    date = new Date();
  }
  console.log(date)
  addExercise(id, description, duration, date, (userId, userName, exDescription, exDuration, exDate) => {
    res.json({username: userName, description: exDescription, duration: exDuration, date: exDate.toDateString(), _id: userId});
  }, ()=> {
    res.send('error')
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params['_id'];
  const start = new Date(req.query.from);
  const end = new Date(req.query.to);
  const limit = req.query.limit;
  console.log(id, start, end, limit)
  getExcercises(id, start, end, limit, (name, logs) => {
    res.send({
      username: name,
      count: logs.length,
      _id: id, 
      log: logs.map(function(log) {return {description: log.description, duration: log.duration, date: log.date.toDateString()}})
    });
  });
});

// listen 
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
