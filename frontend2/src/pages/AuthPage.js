import React, { useState, useEffect } from "react";

const AuthPage = ({ token, setToken, navigate }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState({ auction: false, bids: false });
  const [message, setMessage] = useState("");
  const [userRoles, setUserRoles] = useState([]);

  const toggleRole = (role) => {
    setRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const decodeRolesFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || [];
    } catch {
      return [];
    }
  };

  const register = async () => {
    setMessage("");
    try {
      const res = await fetch("http://localhost:4000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, roles }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch {
      setMessage("Network error during registration");
    }
  };

  const login = async () => {
    setMessage("");
    try {
      const selectedRoles = Object.entries(roles)
        .filter(([_, enabled]) => enabled)
        .map(([r]) => r);

      const res = await fetch("http://localhost:4000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, roles: selectedRoles }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUserRoles(decodeRolesFromToken(data.token)); 
        setMessage("Connexion succeded");
      } else {
        setMessage(data.message || "Error of connexion");
      }
    } catch {
      setMessage("Network error during login");
    }
  };

  useEffect(() => {
    if (token) {
      setUserRoles(decodeRolesFromToken(token));
    }
  }, [token]);

  return (
    <div>
      <h2>Register / Connexion</h2>
      <input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
      <br />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <br />
      <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
      <br />
      <label>
        <input type="checkbox" checked={roles.auction} onChange={() => toggleRole("auction")} />
        Auction role
      </label>
      <label style={{ marginLeft: 20 }}>
        <input type="checkbox" checked={roles.bids} onChange={() => toggleRole("bids")} />
        Bids role
      </label>
      <br />
      <button onClick={register}>Register</button>
      <button onClick={login} style={{ marginLeft: 10 }}>
        Login 
      </button>

      {token && (
        <>
          <p style={{ color: "green" }}>Connecté</p>

          {userRoles.includes("auction") && (
            <button onClick={() => navigate("/auction")}>Access to Auction</button>
          )}

          {userRoles.includes("bids") && (
            <button onClick={() => navigate("/bids")} style={{ marginLeft: 10 }}>
              Access to Bids
            </button>
          )}
        </>
      )}

      {message && <p style={{ color: "blue" }}>{message}</p>}
    </div>
  );
};

export default AuthPage;
