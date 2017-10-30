export default function socketEvent(io) {
  io.on('connection', socket => {
    console.log(`User connected`)

    socket.on('enter-conversation', conversation => {
      socket.join(conversation)
    })
  
    socket.on('leave-conversation', conversation => {
      socket.leave(conversation)
    })
  
    socket.on('new-message', conversation => {
      io.sockets.in(conversation).emit('refresh-messages', conversation)
    })
  
    socket.on('disconnect', () => {
      console.log('User disconnected')
    })
  })
}