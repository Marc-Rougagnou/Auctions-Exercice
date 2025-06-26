require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const bidSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  auction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Bid = mongoose.model('bids', bidSchema);

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

app.post('/bids', async (req, res) => {
  try {
    const { user_id, auction_id, amount } = req.body;
    const Auction = mongoose.model('Auction');
    const auction = await Auction.findById(auction_id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (new Date(auction.ends_at) < new Date()) {
      return res.status(400).json({ message: 'This auction has already ended' });
    }
    const lastBid = await Bid.findOne({ auction_id }).sort({ amount: -1 });
    const minimumBid = lastBid ? lastBid.amount : auction.starting_price;

    if (amount <= minimumBid) {
      return res.status(400).json({ message: 'The bid must be higher than the current or starting price' });
    }
    const bid = new Bid({ user_id, auction_id, amount });
    await bid.save();
    auction.current_price = amount;
    if (auction.status !== 'live') {
      auction.status = 'live';
    }
    await auction.save();
    res.status(201).json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/bids/auction/:auction_id', async (req, res) => {
  try {
    const bids = await Bid.find({ auction_id: req.params.auction_id }).sort({ amount: -1 });
    res.json(bids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/bids/user/:user_id', async (req, res) => {
  try {
    const bids = await Bid.find({ user_id: req.params.user_id }).sort({ timestamp: -1 });
    res.json(bids);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  app.listen(process.env.PORT, () => {
    console.log('Bid Service start on port', process.env.PORT);
  });
}).catch(err => {
  console.error('Erreur MongoDB:', err);
});
