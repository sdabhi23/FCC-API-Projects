const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const Users = require('./users')
const Exercises = require('./exercises')

app.post('/api/exercise/new-user', (req, res, next) => {
  const user = new Users(req.body)
  user.save((err, savedUser) => {
    if(err) {
      if(err.code == 11000) {
        // uniqueness error (no custom message)
        return next({
          status: 400,
          message: 'username already taken'
        })
      } else {
        return next(err)
      }
    }

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    })
  })
})

app.post('/api/exercise/add', (req, res, next) => {
  Users.findById(req.body.userId, (err, user) => {
    if(err) return next(err)
    if(!user) {
      return next({
        status: 400,
        message: 'unknown _id'
      })
    }
    const exercise = new Exercises(req.body)
    exercise.username = user.username
    exercise.save((err, savedExercise) => {
      if(err) return next(err)
      savedExercise = savedExercise.toObject()
      delete savedExercise.__v
      savedExercise._id = savedExercise.userId
      delete savedExercise.userId
      savedExercise.date = (new Date(savedExercise.date)).toDateString()
      res.json(savedExercise)
    })
  })
})

app.get('/api/exercise/users', (req,res,next) => {
  Users.find({}, (err, data) => {
    res.json(data)
  })
})

app.get('/api/exercise/log', (req, res, next) => {
  const from = new Date(req.query.from)
  const to = new Date(req.query.to)
  console.log(req.query.userId)
  Users.findById(req.query.userId, (err, user) => {
    if(err) return next(err);
    if(!user) {
      return next({status:400, message: 'unknown userId'})
    }
    console.log(user)
    Exercises.find({
      userId: req.query.userId,
        date: {
          $lt: to != 'Invalid Date' ? to.getTime() : Date.now() ,
          $gt: from != 'Invalid Date' ? from.getTime() : 0
        }
      }, {
        __v: 0,
        _id: 0
      })
    .sort('-date')
    .limit(parseInt(req.query.limit))
    .exec((err, exercises) => {
      if(err) return next(err)
      const out = {
          _id: req.query.userId,
          username: user.username,
          from : from != 'Invalid Date' ? from.toDateString() : undefined,
          to : to != 'Invalid Date' ? to.toDateString(): undefined,
          count: exercises.length,
          log: exercises.map(e => ({
            description : e.description,
            duration : e.duration,
            date: e.date.toDateString()
          })
        )
      }
      res.json(out)
    })
  })
})

app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    errCode = 400
    const keys = Object.keys(err.errors)
    errMessage = err.errors[keys[0]].message
  } else {
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
