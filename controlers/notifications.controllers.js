import { Notification } from "../models/notifications.js";


export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

        if (!notifications) {
            return res.status(404).json({ message: "No notifications found" });
        }

        return res.status(200).json({ notifications });
    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        })
    }
}


export const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.updateMany(
            { userId: userId },
            { $set: { seen: true } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({
                success: false,
                message: "No notifications found to update",
            });
        }

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
};