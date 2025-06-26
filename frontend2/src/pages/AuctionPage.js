import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuctionPage({ token }) {
  const [auctions, setAuctions] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    starting_price: "",
    ends_at: "",
  });
  const [message, setMessage] = useState("");
  const [authorized, setAuthorized] = useState(false);

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

      if (data.user?.roles?.auction) {
        setAuthorized(true);
        fetchAuctions(); 
      } else {
        setMessage("Error you do not have access rights to this page");
      }
    } catch (err) {
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
    } catch (error) {
      setMessage("Error loading auctions");
    }
  };

  useEffect(() => {
    verifyAccess();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Do you really want to delete this auction?Error loading auctions?")) return;

    try {
      const res = await fetch(`http://localhost:4000/api/auctions/auctions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Auction deleted");
        fetchAuctions();
      } else {
        setMessage(data.message || "Error deleting auction");
      }
    } catch {
      setMessage("Network error during auction deletion");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("http://localhost:4000/api/auctions/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Auction created");
        setForm({ title: "", description: "", starting_price: "", ends_at: "" });
        fetchAuctions();
      } else {
        setMessage(data.message || "Error creating auction");
      }
    } catch (err) {
      setMessage("Network error during auction creation");
    }
  };

  const isFormValid = () => {
    return (
      form.title.trim() !== "" &&
      form.description.trim() !== "" &&
      form.starting_price !== "" &&
      form.ends_at !== ""
    );
  };

  if (!authorized) {
    return <div style={{ padding: 20 }}><p style={{ color: "red" }}>{message}</p></div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: 20 }}>
        ← Come back to home (connexion)
      </button>

      <h2>Create an auction</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Titre"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <br />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <br />
        <input
          type="number"
          placeholder="Prix de départ"
          value={form.starting_price}
          onChange={(e) => setForm({ ...form, starting_price: e.target.value })}
        />
        <br />
        <input
          type="datetime-local"
          placeholder="Fin"
          value={form.ends_at}
          onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
        />
        <br />
        <button type="submit" disabled={!isFormValid()}>
          Create
        </button>
      </form>

      <p>{message}</p>

      <h3>List of auctions</h3>
      <ul>
        {auctions.map((a) => (
          <li key={a._id}>
            {a.title}
            <button
              onClick={() => navigate(`/auction/${a._id}`)}
              style={{ marginLeft: 10 }}
            >
              Details
            </button>
            <button
              onClick={() => handleDelete(a._id)}
              style={{ marginLeft: 10 }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
