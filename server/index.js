
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "OK",
      message: "Backend and PostgreSQL are working correctly",
    });
  } catch (error) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Get all events, with optional search and filters
app.get("/api/events", async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`title ILIKE $${values.length}`);
    }

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const order = sort === "date_desc"
      ? "DESC"
      : "ASC";

    const result = await pool.query(
      `SELECT e.*,
        (SELECT COUNT(*)::int FROM registrations r
         WHERE r.event_id = e.id) AS registration_count
       FROM events e ${where}
       ORDER BY e.event_date ${order}`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get events error:", error.message);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get one event
app.get("/api/events/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*,
        (SELECT COUNT(*)::int FROM registrations r
         WHERE r.event_id = e.id) AS registration_count
       FROM events e WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get event error:", error.message);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// Create event
app.post("/api/events", async (req, res) => {
  try {
    const {
      title, description, category, event_date,
      venue, capacity, status, image_url,
    } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      !event_date ||
      !venue?.trim() ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) <= 0
    ) {
      return res.status(400).json({
        message: "Title, category, date, venue and positive capacity are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO events
       (title, description, category, event_date, venue,
        capacity, status, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title.trim(),
        description || "",
        category.trim(),
        event_date,
        venue.trim(),
        Number(capacity),
        status || "Upcoming",
        image_url || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create event error:", error.message);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// Update event
app.put("/api/events/:id", async (req, res) => {
  try {
    const {
      title, description, category, event_date,
      venue, capacity, status, image_url,
    } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      !event_date ||
      !venue?.trim() ||
      !Number.isInteger(Number(capacity)) ||
      Number(capacity) <= 0 ||
      !["Upcoming", "Ongoing", "Completed"].includes(status)
    ) {
      return res.status(400).json({
        message: "Provide valid event details and status",
      });
    }

    const result = await pool.query(
      `UPDATE events
       SET title=$1, description=$2, category=$3,
           event_date=$4, venue=$5, capacity=$6,
           status=$7, image_url=$8
       WHERE id=$9
       RETURNING *`,
      [
        title.trim(),
        description || "",
        category.trim(),
        event_date,
        venue.trim(),
        Number(capacity),
        status,
        image_url || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update event error:", error.message);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// Delete event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM events WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error.message);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

 // Get registrations for an event
app.get("/api/events/:id/registrations", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, contact, event_id, registered_at
       FROM registrations
       WHERE event_id = $1
       ORDER BY registered_at DESC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get registrations error:", error.message);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

// Register for an event
app.post("/api/events/:id/register", async (req, res) => {
  const client = await pool.connect();

  try {
    const { full_name, email, contact } = req.body;
    const eventId = req.params.id;

    if (
      !full_name?.trim() ||
      !email?.trim() ||
      !contact?.trim()
    ) {
      return res.status(400).json({
        message: "Full name, email and contact are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    await client.query("BEGIN");

    const eventResult = await client.query(
      "SELECT id, capacity FROM events WHERE id = $1 FOR UPDATE",
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Event not found" });
    }

    const duplicate = await client.query(
      `SELECT id FROM registrations
       WHERE event_id = $1 AND LOWER(email) = LOWER($2)`,
      [eventId, email.trim()]
    );

    if (duplicate.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "This email is already registered for this event",
      });
    }

    const countResult = await client.query(
      "SELECT COUNT(*)::int AS total FROM registrations WHERE event_id = $1",
      [eventId]
    );

    if (countResult.rows[0].total >= eventResult.rows[0].capacity) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "This event is full" });
    }

    const result = await client.query(
      `INSERT INTO registrations (full_name, email, contact, event_id)
       VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, full_name, email, contact, event_id, registered_at`,
      [full_name.trim(), email.trim(), contact.trim(), eventId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Registration successful",
      registration: result.rows[0],
      registration_count: countResult.rows[0].total + 1,
      available_seats: eventResult.rows[0].capacity - countResult.rows[0].total - 1,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Registration error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This email is already registered for this event",
      });
    }

    res.status(500).json({ message: "Failed to register for event" });
  } finally {
    client.release();
  }
});

async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
