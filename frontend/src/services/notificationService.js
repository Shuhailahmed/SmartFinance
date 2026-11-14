import api from "./api";

const getNotifications = async (token) => {
  const response = await api.get("/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const getUnreadCount = async (token) => {
  const response = await api.get("/notifications/unread-count", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const createNotification = async (token, data) => {
  const response = await api.post("/notifications", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

const markAsRead = async (token, id) => {
  const response = await api.put(
    `/notifications/${id}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

const markAllAsRead = async (token) => {
  const response = await api.put(
    "/notifications/read-all",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

const deleteNotification = async (token, id) => {
  const response = await api.delete(`/notifications/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
