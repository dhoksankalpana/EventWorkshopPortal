
import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

const emptyForm = {
  title: "",
  description: "",
  category: "Technology",
  event_date: "",
  venue: "",
  capacity: "50",
  status: "Upcoming",
  image_url: "",
};

function Admin() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [viewingEvent, setViewingEvent] = useState(null);
  const [viewingRegistrations, setViewingRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/events`);

      if (!response.ok) {
        throw new Error("Unable to load events.");
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("Load events error:", err.message);
      setError("Could not load events. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEvents();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadEvents]);

  const totalEvents = events.length;

  const upcomingEvents = events.filter(
    (event) => event.status === "Upcoming"
  ).length;

  const completedEvents = events.filter(
    (event) => event.status === "Completed"
  ).length;

  const totalRegistrations = events.reduce(
    (total, event) =>
      total + Number(event.registration_count || 0),
    0
  );

  function updateField(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function startEdit(event) {
    setEditingId(event.id);

    const localDate = new Date(event.event_date);
    localDate.setMinutes(
      localDate.getMinutes() - localDate.getTimezoneOffset()
    );

    setForm({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "Technology",
      event_date: localDate.toISOString().slice(0, 16),
      venue: event.venue || "",
      capacity: String(event.capacity || 50),
      status: event.status || "Upcoming",
      image_url: event.image_url || "",
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  async function saveEvent(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.event_date || Number(form.capacity) < 1) {
      setError("Please enter a valid date and positive seat capacity.");
      return;
    }

    let eventDate;

    try {
      eventDate = new Date(form.event_date).toISOString();
    } catch {
      setError("Please enter a valid event date and time.");
      return;
    }

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      event_date: eventDate,
    };

    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/events/${editingId}`
          : `${API_URL}/events`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save the event.");
      }

      setMessage(
        editingId
          ? "Event updated successfully."
          : "Event created successfully."
      );

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadEvents();
    } catch (err) {
      console.error("Save event error:", err.message);
      setError(err.message || "Could not save the event.");
    }
  }

  async function deleteEvent(event) {
    const confirmed = window.confirm(
      `Delete "${event.title}"? All registrations for this event will also be deleted. This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/events/${event.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete the event.");
      }

      setMessage("Event deleted successfully.");

      if (viewingEvent?.id === event.id) {
        setViewingEvent(null);
        setViewingRegistrations([]);
      }

      await loadEvents();
    } catch (err) {
      setError(err.message || "Could not delete the event.");
    }
  }

  async function viewRegistrations(event) {
    setError("");
    setMessage("");
    setViewingEvent(event);
    setViewingRegistrations([]);
    setLoadingRegistrations(true);

    try {
      const response = await fetch(
        `${API_URL}/events/${event.id}/registrations`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load registrations."
        );
      }

      setViewingRegistrations(data);
    } catch (err) {
      setError(err.message || "Could not load registrations.");
    } finally {
      setLoadingRegistrations(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <a className="brand" href="/">
            <span className="brand-icon">E</span> Eventora
          </a>
          <p>Administration dashboard</p>
        </div>

        <a className="secondary-button" href="/">
          ← Public website
        </a>
      </header>

      <main className="admin-main">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">OVERVIEW</span>
            <h1>Event dashboard</h1>
            <p>Manage your events and track registrations.</p>
          </div>

          <button
            className="primary-button"
            onClick={startCreate}
          >
            + Create event
          </button>
        </div>

        {message && (
          <div className="admin-success" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total events</span>
            <strong>{totalEvents}</strong>
            <small>All events in the system</small>
          </article>

          <article className="stat-card">
            <span>Upcoming events</span>
            <strong>{upcomingEvents}</strong>
            <small>Marked as upcoming</small>
          </article>

          <article className="stat-card">
            <span>Total registrations</span>
            <strong>{totalRegistrations}</strong>
            <small>Across all events</small>
          </article>

          <article className="stat-card">
            <span>Completed events</span>
            <strong>{completedEvents}</strong>
            <small>Marked as completed</small>
          </article>
        </section>

        {showForm && (
          <section className="admin-panel">
            <h2>{editingId ? "Edit event" : "Create a new event"}</h2>

            <form className="admin-form" onSubmit={saveEvent}>
              <label>
                Event title *
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  maxLength={200}
                  required
                />
              </label>

              <label>
                Category *
                <select
                  name="category"
                  value={form.category}
                  onChange={updateField}
                  required
                >
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Design">Design</option>
                  <option value="Workshop">Workshop</option>
                </select>
              </label>

              <label>
                Date and time *
                <input
                  type="datetime-local"
                  name="event_date"
                  value={form.event_date}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Venue *
                <input
                  name="venue"
                  value={form.venue}
                  onChange={updateField}
                  maxLength={200}
                  required
                />
              </label>

              <label>
                Seat capacity *
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={updateField}
                  min="1"
                  step="1"
                  required
                />
              </label>

              <label>
                Status *
                <select
                  name="status"
                  value={form.status}
                  onChange={updateField}
                  required
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>

              <label className="admin-full-width">
                Image URL (optional)
                <input
                  type="url"
                  name="image_url"
                  value={form.image_url}
                  onChange={updateField}
                  placeholder="https://example.com/image.jpg"
                />
              </label>

              <label className="admin-full-width">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  rows={3}
                />
              </label>

              <div className="admin-form-actions admin-full-width">
                <button type="submit" className="primary-button">
                  {editingId ? "Save changes" : "Create event"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm({ ...emptyForm });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="admin-panel">
          <div className="admin-table-heading">
            <div>
              <h2>Manage events</h2>
              <p>
                View event details, edit information, or manage registrations.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={loadEvents}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p className="admin-state">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="admin-state">
              No events yet. Select "Create event" to get started.
            </p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Registrations</th>
                    <th>Seats left</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => {
                    const count = Number(event.registration_count || 0);
                    const seats = Math.max(
                      0,
                      Number(event.capacity) - count
                    );

                    return (
                      <tr key={event.id}>
                        <td>
                          <strong>{event.title}</strong>
                          <small>
                            {event.category} · {event.venue}
                          </small>
                        </td>

                        <td>
                          {new Date(event.event_date).toLocaleDateString("en-IN")}
                        </td>

                        <td>
                          <span
                            className={`status-pill status-${event.status.toLowerCase()}`}
                          >
                            {event.status}
                          </span>
                        </td>

                        <td>{count}</td>
                        <td>{seats}</td>

                        <td>
                          <div className="admin-actions">
                            <button
                              className="table-button"
                              onClick={() => viewRegistrations(event)}
                            >
                              Registrations
                            </button>

                            <button
                              className="table-button"
                              onClick={() => startEdit(event)}
                            >
                              Edit
                            </button>

                            <button
                              className="table-button table-delete"
                              onClick={() => deleteEvent(event)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {viewingEvent && (
          <section className="admin-panel">
            <div className="admin-table-heading">
              <div>
                <h2>Registrations: {viewingEvent.title}</h2>
                <p>
                  {viewingRegistrations.length} registered attendee(s)
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={() => {
                  setViewingEvent(null);
                  setViewingRegistrations([]);
                }}
              >
                Close
              </button>
            </div>

            {loadingRegistrations ? (
              <p className="admin-state">Loading registrations...</p>
            ) : viewingRegistrations.length === 0 ? (
              <p className="admin-state">
                No registrations found for this event.
              </p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Registered on</th>
                    </tr>
                  </thead>

                  <tbody>
                    {viewingRegistrations.map((registration) => (
                      <tr key={registration.id}>
                        <td>{registration.full_name}</td>
                        <td>{registration.email}</td>
                        <td>{registration.contact}</td>
                        <td>
                          {new Date(
                            registration.registered_at
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Admin;
