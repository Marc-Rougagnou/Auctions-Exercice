require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connecté"))
.catch((err) => console.error("Erreur MongoDB :", err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: {
    auction: { type: Boolean, default: false },
    bids: { type: Boolean, default: false },
  },
});
const User = mongoose.models.User || mongoose.model("User", userSchema); //bug sur le user model so to avoid it put ||

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error("Missing token");
  const token = authHeader.split(" ")[1];
  return jwt.verify(token, JWT_SECRET);
}

app.post("/verify/token", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  const token = authHeader.split(" ")[1];
  console.log("Token received :", token);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    console.log("User found :", user);

    if (!user) return res.status(401).json({ message: "User not found" });

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

app.post('/generate-token', (req, res) => {
  const { id, email, roles } = req.body;
  if (!id || !email || !roles) {
    return res.status(400).json({ message: "Miss information for the token" });
  }
  const token = jwt.sign({ id, email, roles }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`[AUTH] Service start on http://localhost:${PORT}`);
});
