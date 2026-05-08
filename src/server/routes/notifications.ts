import express from 'express';
import db from '../db.ts';

const router = express.Router();

// Get all notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await db('notifications')
      .where({ user_id: req.params.userId })
      .orderBy('created_at', 'desc')
      .limit(50);
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark a notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await db('notifications').where({ id: req.params.id }).update({ is_read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await db('notifications').where({ user_id: req.params.userId }).update({ is_read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    await db('notifications').where({ id: req.params.id }).delete();
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
