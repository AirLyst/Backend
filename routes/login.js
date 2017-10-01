// Node Modules
import express from 'express'
import bcrypt from 'bcrypt'

// Errors function
import serverError from '../errors/errors'

// Social media validations
import { validateGoogle, validateFacebook } from '../validations/socialMedia'

// Models
import User from '../models/user'

// Setup express router
const router = express.Router()

router.post('/', async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await User.findOne({ username })
    if (user) { // User found in DB
      if (bcrypt.compareSync(password, user.password)) {
        const token = user.generateJWT()
        return res.json({ token }) // Success
      }
    }
    return res.status(401).json({ errors: { form: 'Invalid Credentials' } })
  } catch (err) {
    return serverError(err, res)
  }
})

router.post('/facebook', async (req, res) => {
  const { accessToken, email } = req.body
  try {
    const response = await validateFacebook(accessToken)
    const { name, id } = response.data

    let user = User.findOne({ facebook_id: id }).catch(serverError)
    if (user) { // User found in DB
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
    user = await User.create(newUser).catch(serverError)
    const token = user.generateJWT()
    return res.json({ token })
  } catch (err) {
    return serverError(err)
  }
})

router.post('/google', async (req, res) => {
  const { id_token } = req.body
  try {
    const response = await validateGoogle(id_token)
    const { sub, email, given_name, family_name, picture } = response.data

    let user = await User.findOne({ google_id: sub }).catch(serverError)
    if (user) {
      const token = user.generateJWT()
      return res.json({ token })
    }

    const newUser = {
      firstName: given_name,
      lastName: family_name,
      email,
      google_id: sub,
      profile_picture: picture,
      listings: []
    }
    user = await User.create(newUser).catch(serverError)
    const token = user.generateJWT()
    return res.json({ token })
  } catch (err) {
    return serverError(err, res)
  }
})

export default router
