const Notification = require('../modals/notification');






async function deliverNotification(io,onlineUsers,notification) {
    const recipientId = notification.recipientId.toString();
  

     const sockets = onlineUsers.get(recipientId);

     if(!sockets || sockets.size === 0){
        return;
     }

    for (const socketId of sockets) {
    io.to(socketId).emit("notification", {
      id: notification._id,
      type: notification.type,
      data: notification.data,
      createdAt: notification.createdAt
    });
  }
  
    await Notification.findByIdAndUpdate(notification._id, {
    status: "delivered",
    deliveredAt: new Date()
  });
}

module.exports = { deliverNotification };