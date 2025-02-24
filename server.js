const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "health_db",
    password: "123yogesh",
    port: 5432
});

// Test API
app.get("/", (req, res) => {
    res.send("Health Directory API is Running!");
});

// Get all doctors
app.get("/doctors", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM doctors");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Add a new doctor
app.post("/doctors", async (req, res) => {
    try {
        const { name, specialty, location, contact_info } = req.body;

        // Validate input
        if (!name || !specialty || !location || !contact_info) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const result = await pool.query(
            "INSERT INTO doctors (name, specialty, location, contact_info) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, specialty, location, contact_info]
        );
        res.json(result.rows[0]); // Send back the added doctor
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error", details: error.message });
    }
});
// Book an appointment
app.post("/appointments", async (req, res) => {
    try {
        const { doctor_id, patient_name, appointment_date, appointment_time, contact_info } = req.body;

        // Validate input
        if (!doctor_id || !patient_name || !appointment_date || !appointment_time || !contact_info) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const result = await pool.query(
            "INSERT INTO appointments (doctor_id, patient_name, appointment_date, appointment_time, contact_info) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [doctor_id, patient_name, appointment_date, appointment_time, contact_info]
        );

        res.json(result.rows[0]); // Send back the booked appointment
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});
// Get all appointments
app.get("/appointments", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT appointments.id, doctors.name AS doctor_name, 
                   appointments.patient_name, appointments.appointment_date, 
                   appointments.appointment_time, appointments.contact_info
            FROM appointments
            JOIN doctors ON appointments.doctor_id = doctors.id
        `);
        res.json(result.rows); // Return all appointments
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});
// Cancel an appointment
app.delete("/appointments/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM appointments WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        res.json({ message: "Appointment cancelled successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});