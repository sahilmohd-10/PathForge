import db from './db.ts';

export const notificationService = {
  async createNotification(userId: number, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    try {
      const [id] = await db('notifications').insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      });
      
      // In a real app, we would emit via Socket.io here if we had access to the 'io' instance
      // For now, we'll rely on the frontend polling or refreshing
      return id;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

  async getUnreadCount(userId: number) {
    try {
      const count = await db('notifications').where({ user_id: userId, is_read: false }).count('id as count').first();
      return count?.count || 0;
    } catch (error) {
      return 0;
    }
  },

  async markAsRead(notificationId: number) {
    try {
      await db('notifications').where({ id: notificationId }).update({ is_read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
};
