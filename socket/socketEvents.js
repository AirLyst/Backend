export default function socketEvent(io) {
  io.on('connection', socket => {
    console.log(`User connected ${socket.conn.id}`)

    socket.on('join-conversation', conversation => {
      console.log(`Joining conversation: ${conversation}`)
      socket.join(conversation)
    })
  
    socket.on('leave-conversation', conversation => {
      console.log(`Leaving conversation: ${conversation}`)
      socket.leave(conversation)
    })
  
    /**
     * data contains the conversationId and the message body
     * @param converationid, sender message
     */
    socket.on('new-message', data => {
      const { message, conversationId, sender } = data
      const messageBody = {
        sender,
        body: message
      }
      io.sockets.in(conversationId).emit('refresh-messages', messageBody)
    })
  
    socket.on('disconnect', () => {
      console.log('User disconnected')
    })
  })
}