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


// listen 
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
