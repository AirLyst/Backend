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
    let allConversations = [], getUserInfo = ''
    for(let conversation of conversations) {
      if (userId.localeCompare(conversation.participants[0]) === 0)
        getUserInfo = conversation.participants[1]
      else
        getUserInfo = conversation.participants[0]
      // Fetch last message sent in the conversation, for preview
      const message = await Message.find({ 'conversationId': conversation._id })
        .sort('-createdAt')
        .limit(1)
      if (message) {
        const otherParticipant = await User.findOne({ _id: getUserInfo })
        .select('firstName lastName profile_picture')
        if (otherParticipant) {
          const { firstName, lastName, profile_picture } = otherParticipant
          let previewMessage
          if(message[0] !== undefined)
            previewMessage = message[0]
          else{
            previewMessage = {
              body: ''
            }
          }
          allConversations.push({ 
            firstName, 
            lastName, 
            profile_picture, 
            previewMessage,
            conversationId: conversation._id,
          })
          if(allConversations.length === conversations.length){
            return res.status(200).send({ conversations: allConversations })
            
          }
        }
      } else {
        res.status(404).send({ err: 'GET Messages Failed' })
      }      
    }
  } else {
    res.status(404).send({ err: 'GET Conversations Failed' })
  }
})

/**
 * Fetch the entire thread in a conversation
 * given a conversation id and the user's id
 * @param _id - id of user who made the request
 * conversationid - the conversation id to find
 */
routes.get('/:_id/:conversationId', async (req, res) => {
  const { _id, conversationId } = req.params
  // get conversation information so we can get other user's id
  const conversation = await Conversation.findOne({ _id: conversationId})
  if(conversation) {
    let getUserInfo
    if (_id.localeCompare(conversation.participants[0]) === 0)
      getUserInfo = conversation.participants[1]
    else
      getUserInfo = conversation.participants[0]
    const userInfo = await User.findOne({ _id: getUserInfo })
    .select('firstName lastName profile_picture')
    if(userInfo) {
      const messages = await Message.find({ conversationId })
      .select('author body')
      
      
      if (messages) { 
        res.status(200).json({ user: userInfo, messages })
      } else {
        res.status(400).send({ err: 'Failed to fetch user information' })
      }
    }
  } else {
    res.status(400).send({ err: 'Failed to get conversation'})
  }

})

/**
 * Create a new conversation
 * @param
 * user - id of user that started the conversation
 * recipient - receiving user
 * message - the text message itself
 */
routes.post('/', async (req, res) => {
  const { user, recipient, message } = req.body
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
        read: false
      })

      if(newMessage) {
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
          author: user,
          read: false
        })

        if(newMessage) {
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

/**
 * Creates a new message in the database
 */
routes.put('/', async (req, res) => {
  const { conversationId, message, author } = req.body

  const reply = await Message.create({
    conversationId,
    body: message,
    author: author,
    read: false
  })

  if(reply) {
    return res.status(200).json({ message: 'Reply sent '})
  } else {
    return res.status(404).json({ err: 'Failed to send reply'})
  }
})

export default routes