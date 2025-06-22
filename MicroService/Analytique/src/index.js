// analytics-service/src/index.js
const express = require("express");
const analyticsRoutes = require("./routes/analytics.routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use("/analytics", analyticsRoutes);

app.listen(PORT, () => {
  console.log(`Analytics service listening on port ${PORT}`);
});
