// Node Modules
import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import bluebird from 'bluebird'
import dotenv from 'dotenv'
import path from 'path'

import secureRoutes from './validations/authenticate'

// Routes
import signup from './routes/signup'
import login from './routes/login'
import listing from './routes/listing'

// Configurations
dotenv.config({ path: path.join(__dirname, '/.env') })
const PORT = process.env.PORT || '4000'

// App setup
const app = express()

// Connect to DB
mongoose.Promise = bluebird
mongoose.connect(process.env.MONGOOSE_CONNECT, { useMongoClient: true })
mongoose.connection.on('error', (err) => {
  console.error(`FAILED TO CONNECT TO DB 🙃 ${err.message}. Make sure you have a .env file.`)
  process.exit(126)
})

// Allow urlencoded or json formatted data to be parsed
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.text())

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  next()
})

// Use routes
app.use('/api/signup', signup)
app.use('/api/login', login)
app.use('/api/listing', listing)

// Root route
app.get('/', (req, res) => { res.send('Home Route /') })

// Test route for authentication middleware
app.get('/secure', secureRoutes, (req, res) => { res.json({ data: 'logged in' }) })

// Start on port
app.listen(PORT, () => {
  console.log(`Server Started at port ${PORT}`)
})
