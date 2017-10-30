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
routes.get('/:userId', async (req, res) => {
  const { userId } = req.params
  const conversations = await Conversation.find({ participants: userId })

  if (conversations) {
    let allConversations = [], otherUser = ''
    conversations.forEach(async conversation => {
      // https://stackoverflow.com/questions/2167602/optimum-way-to-compare-strings-in-javascript
      if (userId.localeCompare(conversation.participants[0]) === 0)
        otherUser = conversation.participants[1]
      else
        otherUser = conversation.participants[0]
      // Fetch last message sent in the conversation, for preview
      const message = await Message.find({ 'conversationId': conversation._id })
        .sort('-createdAt')
        .limit(1)
      if (message) {
        const otherParticipant = await User.findOne({ _id: otherUser })
        if (otherParticipant) {
          allConversations.push({ 
            user: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
            profile_picture: otherParticipant.profile_picture,
            previewMessage: message[0],
          })
          if(allConversations.length === conversations.length)
            return res.status(200).send({ conversations: allConversations })
        }
      } else {
        console.log('get Messages: failed to get conversations')
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
  const { user, recipient, message, displayName } = req.body
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
        author: user,
        displayName
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
  const { conversationId, message, user, displayName } = req.body
  const reply = await Message.create({
    conversationId,
    displayName,
    body: message,
    author: user,
  })

  if(reply) {
    return res.status(200).json({ message: 'Reply sent '})
  } else {
    return res.status(404).json({ err: 'Failed to send reply'})
  }
})

export default routes