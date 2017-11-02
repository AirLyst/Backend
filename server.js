// Node Modules
import express from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import bluebird from 'bluebird'
import dotenv from 'dotenv'
import path from 'path'
import http from 'http'
import cors from 'cors'

// Sockets
import SocketIO from 'socket.io'
import socketEvents from './socket/socketEvents'

// Authentications
import secureRoutes from './validations/authenticate'

// Routes
import signup from './routes/signup'
import login from './routes/login'
import listing from './routes/listing'
import user from './routes/user'
import chat from './routes/chat'

// Configurations
dotenv.config({ path: path.join(__dirname, '/.env') })
const PORT = process.env.PORT || '4000'

// App setup
const app = express()
const server = http.Server(app)
const io = new SocketIO(server)

// Connect to DB
mongoose.Promise = bluebird
mongoose.connect(process.env.MONGOOSE_CONNECT, { useMongoClient: true })
mongoose.connection.on('error', (err) => {
  console.error(`FAILED TO CONNECT TO DB 🙃 ${err.message}. Make sure you have a .env file.`)
  process.exit(126)
})

// Allow urlencoded or json formatted data to be parsed
app.use(bodyParser.urlencoded({ extended: false, limit: '20mb' }))
app.use(bodyParser.json({ limit: '20mb' }))
app.use(bodyParser.text({ limit: '20mb' }))

// Set up sockets
socketEvents(io)

// CORS middleware
app.use(cors('GET, PUT, POST, DELETE, PATCH, OPTIONS'))
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
//   next()
// })

// Use routes
app.use('/api/signup', signup)
app.use('/api/login', login)
app.use('/api/listing', listing)
app.use('/api/user', user)
app.use('/api/chat', chat)

// Root route
app.get('/', (req, res) => { res.send('Home Route /') })

// Test route for authentication middleware
app.get('/secure', secureRoutes, (req, res) => { res.json({ data: 'logged in' }) })

// Start on port
app.listen(PORT, () => {
  console.log(`Server Started at port ${PORT}`)
})

io.listen(5000, () => {
  console.log(`Server Started`)
})
