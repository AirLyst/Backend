import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({ // What each user will look like
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  facebook_id: { type: String, default: '' },
  google_id: { type: String, default: '' },
  profile_picture: { type: String, default: '' },
  listings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  }]
}, { timestamps: true })

userSchema.methods.generateJWT = function generateJWT() {
  return jwt.sign({
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName
  }, process.env.JWT_SECRET, { expiresIn: '10d' })
}

export default mongoose.model('User', userSchema)
