import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing'}
})

export default mongoose.model('Like', likeSchema)