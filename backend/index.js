const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT ;

app.use(
  "/api/users",
  createProxyMiddleware({ target: "http://localhost:5001", changeOrigin: true })
);
app.use(
  "/api/auth",
  createProxyMiddleware({ target: "http://localhost:5004", changeOrigin: true })
);
app.use(
  "/api/auctions",
  createProxyMiddleware({ target: "http://localhost:5002", changeOrigin: true })
);
app.use(
  "/api/bids",
  createProxyMiddleware({ target: "http://localhost:5003", changeOrigin: true })
);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
