require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const PORT = process.env.PORT;

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: {
    auction: { type: Boolean, default: false },
    bids: { type: Boolean, default: false },
  },
});

const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already use' });
    }

    const newUser = new User({ name, email, password, roles });
    await newUser.save();

    res.status(201).json({ message: 'User have been create' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Email or password is/are incorrect' });
    }

    const response = await axios.post(`${AUTH_SERVICE_URL}/generate-token`, {
      id: user._id,
      email: user.email,
      roles: Object.keys(user.roles).filter(role => user.roles[role])
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Error on user' });
  }
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`User service on port: ${PORT}`);
  });
}).catch(err => {
  console.error('Error MongoDB:', err);
});