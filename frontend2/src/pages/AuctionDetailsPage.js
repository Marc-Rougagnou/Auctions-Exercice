import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AuctionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/auctions/auctions/${id}`);
        if (!res.ok) {
          setMessage("Auction not found");
          return;
        }
        const data = await res.json();
        setAuction(data);
      } catch (error) {
        setMessage("Network error");
      }
    };

    fetchAuction();
  }, [id]);

  if (message) {
    return (
      <div style={{ padding: 20 }}>
        <p>{message}</p>
        <button onClick={() => navigate("/auction")}>back to the list</button>
      </div>
    );
  }

  if (!auction) {
    return <div></div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Details of the auction</h2>
      <p><strong>Title:</strong> {auction.title}</p>
      <p><strong>Description:</strong> {auction.description}</p>
      <p><strong>Start price:</strong> {auction.starting_price} €</p>
      <p><strong>Actual Price:</strong> {auction.current_price} €</p>
      <p><strong>Statut:</strong> {auction.status}</p>
      <p><strong>End at:</strong> {new Date(auction.ends_at).toLocaleString()}</p>
      <button onClick={() => navigate("/auction")}>Back to list</button>
    </div>
  );
}
