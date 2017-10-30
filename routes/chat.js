import express from 'express'

import User from '../models/user'
import Conversation from '../models/conversation'
import Message from '../models/message'

const routes = express.Router()

/**
 * Fetch all conversations started by a user,
 * return the conversations with other
 * participants and a one line snippet
 */
routes.get('/', async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })

  if (conversations) {
    let fullConversations = []
    conversations.forEach(async conversation => {
      const message = await Message.find({ 'conversationId': conversation._id })
        .sort('-createdAt')
        .limit(1)
      if(message) {
        fullConversations.push(message)
        if(fullConversations.length === conversations.length)
          return res.status(200).json({ conversations: fullConversations })
      }
    })
  } else {
    console.log('failed to get conversations')
  }
})

/**
 * Fetch the entire thread in a conversation
 * given a conversation id
 */
routes.get('/:conversationId', async (req, res) => {
  const messages = await Message.find({ 'conversationId': req.params.conversationId })
  
  if (message) {
    res.status(200).json({ conversation: messages })
  }
})

/**
 * Start a new conversation
 * @params
 * user - id of user that started the conversation
 * recipient - receiving user
 * message - the text message itself
 */
routes.post('/', async (req, res) => {
  const { user, recipient, message } = req.body
  // const recipientId = req.body.recipient
  const foundRecipient = await User.findOne({ _id: recipient })

  if(foundRecipient) {
    const findConversation = await Conversation.findOne({
      participants: [user, foundRecipient._id]
    })
    if(findConversation) {
      const newMessage = await Message.create({
        conversationId: findConversation._id,
        body: message,
        author: user
      })

      if(newMessage) {
        console.log(message)
        return res.status(200).json({ success: 'Conversation Created', conversationId: findConversation._id })          
      } else {
        return res.status(404).json({ err: 'failed to create conversation'})
      }
      res.status(200).json({ status: 'Conversation exists!', conversationId: findConversation._id })
    } else {
      const conversation = await Conversation.create({
        participants: [user, foundRecipient._id]
      })
  
      if (conversation) {
        const newMessage = await Message.create({
          conversationId: conversation._id,
          body: message,
          author: user
        })

        if(newMessage) {
          console.log(message)
          return res.status(200).json({ success: 'Conversation Created', conversationId: conversation._id })          
        } else {
          return res.status(404).json({ err: 'failed to create conversation'})
        }
      }
    }
  } else {
    return res.status(404).json({ err: 'User not found'})
  }
})

routes.put('/', async (req, res) => {
  const { conversationId, message, user } = req.body
  const reply = await Message.create({
    conversationId,
    body: message,
    author: user
  })

  if(reply) {
    return res.status(200).json({ message: 'Reply sent '})
  } else {
    return res.status(404).json({ err: 'Failed to send reply'})
  }
})

export default routes