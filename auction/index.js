require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const AUTH_SERVICE_URL = "http://localhost:5004";
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

const auctionSchema = new mongoose.Schema({
  title: String,
  description: String,
  starting_price: Number,
  current_price: Number,
  status: { type: String, enum: ["pending", "live", "ended"], default: "pending" },
  ends_at: Date,
  owner_id: String,
});

const Auction = mongoose.model("Auction", auctionSchema);

const bidSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  auction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Bid = mongoose.model('bids', bidSchema);

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });

  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/verify/token`, {}, {
      headers: { Authorization: authHeader },
    });

    const user = response.data.user;

    if (!user.roles || !user.roles.auction) {
      return res.status(403).json({ message: "Access denied : missing role" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.get("/auctions", async (req, res) => {
  try {
    const auctions = await Auction.find();

    const now = new Date();

    const updates = auctions.map(async (auction) => {
      if (auction.status !== "ended" && new Date(auction.ends_at) < now) {
        auction.status = "ended";
        await auction.save();
      }
      return auction;
    });

    const updatedAuctions = await Promise.all(updates);

    res.json(updatedAuctions);
  } catch (err) {
    console.error("Error fetching auctions:", err);
    res.status(500).json({ message: "Error fetching auctions" });
  }
});

app.get("/auctions/:id", async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ message: "Auction not found" });
  res.json(auction);
});

app.post("/auctions", verifyToken, async (req, res) => {
  const { title, description, starting_price, ends_at } = req.body;
  const auction = new Auction({
    title,
    description,
    starting_price,
    current_price: starting_price,
    ends_at,
    owner_id: req.user.id,
  });
  await auction.save();
  res.status(201).json(auction);
});

app.delete("/auctions/:id", verifyToken, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.owner_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Denied" });
    }

    await Bid.deleteMany({ auction_id: auction._id });

    await auction.deleteOne();

    res.json({ message: "Auction and related bids deleted successfully" });
  } catch (error) {
    console.error("Error during deletion:", error);
    res.status(500).json({ message: "Server error during deletion" });
  }
});
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("[AUCTION] Connect to MongoDB");
    app.listen(PORT, () =>
      console.log(`[AUCTION] Service start on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("Error MongoDB:", err));



  