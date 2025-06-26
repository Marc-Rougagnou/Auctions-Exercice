import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BidsPage({ token }) {
  const [bids, setBids] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [auctionId, setAuctionId] = useState("");
  const [amount, setAmount] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [auctions, setAuctions] = useState([]);

  const navigate = useNavigate();

  const verifyAccess = async () => {
    try {
      const res = await fetch("http://localhost:5004/verify/token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setMessage("Error token invalid or expired");
        return;
      }

      const data = await res.json();

      if (data.user) {
        setAuthorized(true);
        setUserId(data.user.id);
        fetchUserBids(data.user.id);
        fetchAuctions();
      } else {
        setMessage("Error access denied");
      }
    } catch {
      setMessage("Network error during role verification");
    }
  };

  const fetchAuctions = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/auctions/auctions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setAuctions(data);
    } catch {
      setMessage("Error loading auctions");
    }
  };

  const fetchUserBids = async (uid) => {
    try {
      const res = await fetch(`http://localhost:4000/api/bids/bids/user/${uid}`);
      const data = await res.json();
      setMyBids(data);
    } catch {
      setMessage("Error loading your bids");
    }
  };

  const fetchAuctionBids = async (aid) => {
    try {
      const res = await fetch(`http://localhost:4000/api/bids/bids/auction/${aid}`);
      const data = await res.json();
      setBids(data);
    } catch {
      setMessage("Error loading auction bids");
    }
  };

  useEffect(() => {
    verifyAccess();
  }, []);

  useEffect(() => {
    if (auctionId) {
      fetchAuctionBids(auctionId);
    }
  }, [auctionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:4000/api/bids/bids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          auction_id: auctionId,
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Bid placed");
        setAmount("");
        fetchAuctionBids(auctionId);
        fetchUserBids(userId);
      } else {
        setMessage(data.message || "Error placing bid");
      }
    } catch {
      setMessage("Network error during bid placement");
    }
  };

  const isFormValid = () => {
  const selectedAuction = auctions.find((a) => a._id === auctionId);
  return (
    auctionId &&
    parseFloat(amount) > 0 &&
    (!selectedAuction || parseFloat(amount) > selectedAuction.starting_price)
  );
};

  if (!authorized) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: "red" }}>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: 20 }}>
        ← Back to home (connexion)  
      </button>

      <h2>Put a bid</h2>

      <form onSubmit={handleSubmit}>
        <select value={auctionId} onChange={(e) => setAuctionId(e.target.value)}>
          <option value="">Choose an auction</option>
          {auctions.map((a) => (
            <option key={a._id} value={a._id}>
              {a.title}
            </option>
          ))}
        </select>
        <br />
        <input
          type="number"
          placeholder="Montant"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <br />
        <button type="submit" disabled={!isFormValid()}>
          Bet
        </button>
      </form>

      <p>{message}</p>

      {auctionId && (
        <>
          <h3>Bid for the auction</h3>
          <ul>
            {bids.map((b) => (
              <li key={b._id}>
                {b.amount}$ {new Date(b.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Your bid</h3>
      <ul>
        {myBids.map((b) => {
          const auction = auctions.find((a) => a._id === b.auction_id);
          const auctionTitle = auction ? auction.title : "Enchère inconnue";
          return (
            <li key={b._id}>
              {b.amount}$ on the auction <b>{auctionTitle}</b> at {new Date(b.timestamp).toLocaleString()}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
