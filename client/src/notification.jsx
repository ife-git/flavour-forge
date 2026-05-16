// components/Notification.jsx
import React, { useContext } from "react";
import { NotificationContext } from "../context/notificationContext";

export default function Notification() {
  const { notifications, removeNotification } = useContext(NotificationContext);

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {notifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            backgroundColor: notif.type === "success" ? "#78e07b" : "#ca3f36",
            color: "white",
            padding: "15px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: "250px",
            animation: "slideIn 0.3s ease",
          }}
        >
          <span>{notif.message}</span>
          <button
            onClick={() => removeNotification(notif.id)}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
