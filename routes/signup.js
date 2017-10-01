// Node modules
import express from 'express'
import bcrypt from 'bcrypt'

// Models
import User from '../models/user'

// Error functions
import serverError from '../errors/errors'

// Social media validations
import { validateGoogle, validateFacebook } from '../validations/socialMedia'

// Validation function
import validateInput from '../validations/signup'

// Setup express router
const router = express.Router()

router.post('/', async (req, res) => {
  if (!validateInput(req.body).isValid) return res.send('Empty fields')
  const { firstName, lastName, email, username, password } = req.body
  try {
    let user = await User.findOne({ username })
    if (user) return res.status(422).json({ error: 'Username taken' })

    const newUser = {
      firstName,
      lastName,
      email,
      username,
      password: bcrypt.hashSync(password, 10),
      listings: []
    }
    user = await User.create(newUser)
    const token = user.generateJWT()
    return res.json({ token })
  } catch (err) {
    return serverError(err, res)
  }
})

router.post('/facebook', async (req, res) => {
  const { accessToken, email } = req.body
  try {
    const response = await validateFacebook(accessToken)
    const { name, id } = response.data

    let user = await User.findOne({ facebook_id: id }).catch(serverError(res))
    if (user) {
      const token = user.generateJWT()
      return res.json({ token }) // Success
    }

    const newUser = {
      firstName: name.split(' ')[0],
      lastName: name.split(' ')[1],
      email,
      facebook_id: id,
      listings: []
    }
    user = await User.create(newUser).catch(serverError(res))
    const token = user.generateJWT()
    return res.json({ token }) // Success
  } catch (err) {
    return serverError(err, res)
  }
})

router.post('/google', async (req, res) => {
  const { id_token } = req.body
  try {
    const response = await validateGoogle(id_token)
    const { sub, email, given_name, family_name, picture } = response.data

    let user = await User.findOne({ google_id: sub })
    if (user) {
      const token = user.generateJWT()
      return res.json({ token }) // Success
    }

    const newUser = {
      firstName: given_name,
      lastName: family_name,
      email,
      google_id: sub,
      profile_picture: picture,
      listings: []
    }
    user = await User.create(newUser)
    const token = user.generateJWT()
    return res.json({ token })
  } catch (err) {
    return serverError(err, res)
  }
})

export default router
