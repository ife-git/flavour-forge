// components/contact.jsx
import React, { useState } from "react";
import { useNotification } from "../context/notificationContext";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission (replace with actual API call)
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success notification
      showNotification(
        "Message sent! We'll respond within 24 hours.",
        "success",
      );

      // Clear form
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      showNotification("Failed to send message. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <h1>Contact Us</h1>

      <p className="contact-intro">
        Have a question about a recipe, or Flavour Forge in general? We'd love
        to hear from you.
      </p>

      <div className="contact-grid">
        {/* Contact Form */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Message
            <textarea
              name="message"
              rows="5"
              placeholder="How can we help you?"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>

        {/* Contact Info */}
        <div className="contact-info">
          <h3>Flavour Forge</h3>
          <p>Email: support@flavourforge.com</p>
          <p>Phone: +234 800 000 0000</p>
          <p>Hours: Mon – Fri, 9am – 6pm</p>
        </div>
      </div>
    </div>
  );
}
