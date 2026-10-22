
import { useEffect, useState } from "react";
import "./App.css";
import Admin from "./Admin";

const API_URL = "http://localhost:5000/api";

function App() {
  const [currentHash, setCurrentHash] = useState(
    window.location.hash
  );

  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("date_asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showRegistration, setShowRegistration] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationError, setRegistrationError] = useState(false);

  // Listen for URL hash changes.
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Fetch events from the backend.
  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (category) {
        params.set("category", category);
      }

      if (sort) {
        params.set("sort", sort);
      }

      const response = await fetch(
        `${API_URL}/events?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load events (${response.status}).`);
      }

      setEvents(await response.json());
    } catch (err) {
      console.error("Fetch events error:", err.message);

      setError(
        "Could not load events. Please check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch events when the public page is active.
  useEffect(() => {
    if (currentHash === "#admin") {
      return;
    }

    const timer = setTimeout(fetchEvents, 300);

    return () => clearTimeout(timer);
  }, [search, category, sort, currentHash]);

  // Display the admin dashboard when #admin is in the URL.
  if (currentHash === "#admin") {
    return <Admin />;
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRemainingSeats(event) {
    return Math.max(
      0,
      Number(event.capacity) -
        Number(event.registration_count || 0)
    );
  }

  function openRegistration(event) {
    setSelectedEvent(event);
    setShowRegistration(true);
    setFullName("");
    setEmail("");
    setContact("");
    setRegistrationMessage("");
    setRegistrationError(false);
  }

  async function handleRegistration(e) {
    e.preventDefault();

    if (!selectedEvent) {
      return;
    }

    setRegistering(true);
    setRegistrationMessage("");
    setRegistrationError(false);

    try {
      const response = await fetch(
        `${API_URL}/events/${selectedEvent.id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            contact: contact.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed."
        );
      }

      setRegistrationMessage(
        `Registration successful! ${data.available_seats} seats remaining.`
      );

      await fetchEvents();

      setSelectedEvent((current) =>
        current
          ? {
              ...current,
              registration_count: data.registration_count,
            }
          : current
      );
    } catch (err) {
      setRegistrationError(true);

      setRegistrationMessage(
        err.message || "Registration failed. Please try again."
      );
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">E</span>
          Eventora
        </a>

        <nav>
          <a className="nav-active" href="#events">
            Explore Events
          </a>

          <a href="#about">About</a>

          <a className="admin-link" href="#admin">
            Admin Portal ↗
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              DISCOVER · CONNECT · GROW
            </span>

            <h1>
              Find your next
              <br />
              <span>great experience.</span>
            </h1>

            <p>
              Discover workshops, conferences and experiences that
              inspire new ideas and bring people together.
            </p>

            <a className="primary-button" href="#events">
              Explore events <span>↓</span>
            </a>
          </div>

          <div className="hero-art" aria-label="Event illustration">
            <div className="art-orbit orbit-one"></div>
            <div className="art-orbit orbit-two"></div>

            <div className="art-card">
              <span className="art-spark">✳</span>
              <span className="art-label">YOUR NEXT CHAPTER</span>

              <div className="art-title">
                Ideas become
                <br />
                experiences.
              </div>

              <div className="art-bottom">
                <span>MEET · LEARN · CREATE</span>
                <span>✦</span>
              </div>
            </div>

            <span className="floating-dot dot-one"></span>
            <span className="floating-dot dot-two"></span>
            <span className="floating-star">✳</span>
          </div>
        </section>

        <section className="events-section" id="events">
          <div className="section-heading">
            <div>
              <span className="eyebrow">WHAT'S HAPPENING</span>
              <h2>Explore experiences</h2>
              <p>Find something worth showing up for.</p>
            </div>

            <span className="event-count">
              {events.length}{" "}
              {events.length === 1 ? "event" : "events"}
            </span>
          </div>

          <div className="filters">
            <div className="search-box">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search events by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="Design">Design</option>
              <option value="Workshop">Workshop</option>
            </select>

            <select
              aria-label="Sort events"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="date_asc">
                Date: earliest first
              </option>
              <option value="date_desc">
                Date: latest first
              </option>
            </select>
          </div>

          {loading && (
            <div className="state-message">
              Loading events...
            </div>
          )}

          {!loading && error && (
            <div
              className="state-message error-message"
              role="alert"
            >
              <p>{error}</p>

              <button
                className="secondary-button"
                onClick={fetchEvents}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">✳</span>
              <h3>No events found</h3>

              <p>
                Try another search or category, or check back for
                new events.
              </p>

              <button
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="event-grid">
              {events.map((event, index) => {
                const remaining = getRemainingSeats(event);

                return (
                  <article
                    className="event-card"
                    key={event.id}
                  >
                    <div
                      className={`event-image image-${index % 4}`}
                    >
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                        />
                      ) : (
                        <>
                          <span className="image-symbol">
                            {event.category === "Technology"
                              ? "⌘"
                              : event.category === "Business"
                                ? "↗"
                                : event.category === "Design"
                                  ? "✳"
                                  : "✦"}
                          </span>

                          <span className="image-caption">
                            {event.category}
                          </span>
                        </>
                      )}

                      <span className="category-pill">
                        {event.category}
                      </span>
                    </div>

                    <div className="event-card-body">
                      <div className="event-date">
                        <span>▦</span>
                        {formatDate(event.event_date)}
                        <span className="date-divider">·</span>
                        {formatTime(event.event_date)}
                      </div>

                      <h3>{event.title}</h3>

                      <p className="event-description">
                        {event.description ||
                          "Join us for a memorable experience."}
                      </p>

                      <div className="event-venue">
                        <span>⌖</span> {event.venue}
                      </div>

                      <div className="event-card-footer">
                        <span
                          className={
                            remaining === 0 ? "sold-out" : "seats"
                          }
                        >
                          {remaining === 0
                            ? "Fully booked"
                            : `${remaining} seats left`}
                        </span>

                        <button
                          className="details-button"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowRegistration(false);
                            setRegistrationMessage("");
                          }}
                        >
                          View details <span>↗</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">MORE THAN AN EVENT</span>
          <h2>Make room for what's next.</h2>

          <p>
            Every event is an opportunity to learn something new,
            meet someone inspiring, or start your next big idea.
          </p>

          <a href="#events" className="about-link">
            Find your experience ↗
          </a>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="/">
          <span className="brand-icon">E</span>
          Eventora
        </a>

        <span>
          Bring people together. Make ideas happen.
        </span>

        <span>© 2026 Eventora</span>
      </footer>

      {selectedEvent && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setSelectedEvent(null);
            setShowRegistration(false);
          }}
        >
          <div
            className="event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => {
                setSelectedEvent(null);
                setShowRegistration(false);
              }}
              aria-label="Close event details"
            >
              ×
            </button>

            {showRegistration ? (
              <>
                <span className="eyebrow">SAVE YOUR SEAT</span>

                <h2 id="modal-title">
                  Register for {selectedEvent.title}
                </h2>

                <p>
                  Enter your details to reserve your place.
                </p>

                {registrationMessage && (
                  <div
                    className={
                      registrationError
                        ? "error-message"
                        : "success-message"
                    }
                    role="status"
                    style={{
                      padding: "12px",
                      margin: "15px 0",
                      borderRadius: "8px",
                    }}
                  >
                    {registrationMessage}
                  </div>
                )}

                {!registrationMessage || registrationError ? (
                  <form
                    className="registration-form"
                    onSubmit={handleRegistration}
                  >
                    <label htmlFor="full-name">
                      Full name
                    </label>

                    <input
                      id="full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                      maxLength={150}
                    />

                    <label htmlFor="email">
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      required
                      maxLength={255}
                    />

                    <label htmlFor="contact">
                      Contact number
                    </label>

                    <input
                      id="contact"
                      type="tel"
                      value={contact}
                      onChange={(e) =>
                        setContact(e.target.value)
                      }
                      placeholder="Enter your contact number"
                      required
                      maxLength={30}
                    />

                    <button
                      type="submit"
                      className="primary-button modal-register"
                      disabled={
                        registering ||
                        getRemainingSeats(selectedEvent) === 0
                      }
                    >
                      {registering
                        ? "Registering..."
                        : getRemainingSeats(selectedEvent) === 0
                          ? "Event fully booked"
                          : "Confirm registration ↗"}
                    </button>
                  </form>
                ) : (
                  <button
                    className="primary-button modal-register"
                    onClick={() => {
                      setSelectedEvent(null);
                      setShowRegistration(false);
                    }}
                  >
                    Done
                  </button>
                )}

                {!registrationMessage && (
                  <button
                    className="secondary-button"
                    style={{
                      width: "100%",
                      marginTop: "12px",
                    }}
                    onClick={() => setShowRegistration(false)}
                  >
                    Back to event details
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="eyebrow">
                  {selectedEvent.category}
                </span>

                <h2 id="modal-title">
                  {selectedEvent.title}
                </h2>

                <p>
                  {selectedEvent.description ||
                    "Join us for this event."}
                </p>

                <div className="modal-detail">
                  <strong>Date</strong>
                  <span>
                    {formatDate(selectedEvent.event_date)}
                  </span>
                </div>

                <div className="modal-detail">
                  <strong>Time</strong>
                  <span>
                    {formatTime(selectedEvent.event_date)}
                  </span>
                </div>

                <div className="modal-detail">
                  <strong>Venue</strong>
                  <span>{selectedEvent.venue}</span>
                </div>

                <div className="modal-detail">
                  <strong>Availability</strong>
                  <span>
                    {getRemainingSeats(selectedEvent)} seats
                    remaining
                  </span>
                </div>

                <button
                  className="primary-button modal-register"
                  disabled={
                    getRemainingSeats(selectedEvent) === 0
                  }
                  onClick={() =>
                    openRegistration(selectedEvent)
                  }
                >
                  {getRemainingSeats(selectedEvent) === 0
                    ? "Event fully booked"
                    : "Register for event ↗"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
