const express = require('express');
const actionRouter = express.Router();
const mongoose = require('mongoose');

const Notification = require('../modals/notification');
const User = require('../modals/user');
const auth = require('../middlewares/auth');


async function createNotification({ recipientId, actorId, type, entityId, data, status = 'created' }) {
  return Notification.create({
    recipientId,
    actorId,
    type,
    entityId,
    data,
    status
  });
}



actionRouter.post('/users/:id/follow', auth, async (req, res) => {
  try {
    const recipientId = req.params.id;
    const actorId = req.user._id;

    if (!mongoose.isValidObjectId(recipientId)) {
      throw new Error('Invalid user id');
    }

    if (actorId.equals(recipientId)) {
      throw new Error('Users cannot follow themselves');
    }

    const targetUser = await User.findById(recipientId);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

   

    await createNotification({
      recipientId: targetUser._id,
      actorId: actorId,
      type: 'follow',
      entityId: null,
      data: {
        message: `${req.user.email} started following you.`
      },
      status: 'created'
    });

    res.status(201).json({ message: 'Follow action recorded' });
  } catch (err) {
      return res.status(400).json({ error: err.message });
  }
});


actionRouter.post('/users/:id/like', auth, async (req, res) => {
    try{
            const recipientId = req.params.id;
    const actorId = req.user._id;

    if (!mongoose.isValidObjectId(recipientId)) {
        throw new Error('Invalid user id');
    }
    if (actorId.equals(recipientId)) {
        throw new Error('You cannot like yourself');
    }

    const targetUser = await User.findById(recipientId);
    if (!targetUser) {
        throw new Error('Target user not found');
    }


    await createNotification({
      recipientId: targetUser._id,
      actorId: actorId,
      type: 'like',
      entityId: null,
      data: {
        message: `${req.user.email} liked your post.`
      },
      status: 'created'
    });

    res.status(201).json({ message: 'Like action recorded' });


    }catch(err){
        return res.status(400).json({ error: err.message });
    }
})

module.exports = actionRouter;
