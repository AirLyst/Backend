import mongoose from 'mongoose'

const listingSchema = new mongoose.Schema({ // What each user will look like
  name: { type: String, required: true },
  description: { type: String, required: true },
  description: { type: [String], default: [] },
  brand: { type: String, required: true },
  condition: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: String, required: true },
  category: { type: String, required: true },
  photos: { type: [String], default: [] },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

export default mongoose.model('Listing', listingSchema)
