const express = require("express");
const reportRoutes = require("./routes/report.routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use("/report", reportRoutes);

app.listen(PORT, () => {
  console.log(`Report service listening on port ${PORT}`);
});