import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import AuctionPage from "./pages/AuctionPage";
import BidsPage from "./pages/BidsPage";
import AuctionDetailsPage from "./pages/AuctionDetailsPage";

function App() {
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  return (
    <div style={{ padding: 20 }}>
      <Routes>
        <Route
          path="/"
          element={<AuthPage token={token} setToken={setToken} navigate={navigate} />}
        />
        <Route path="/auction" element={<AuctionPage token={token} />} />
        <Route path="/bids" element={<BidsPage token={token} />} />
        <Route path="/auction/:id" element={<AuctionDetailsPage />} />

      </Routes>
    </div>
  );
}

export default App;
