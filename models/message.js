import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  body: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
},
{
  timestamps: true
})

export default mongoose.model('Message', messageSchema)
