const { getTrends } = require("./trends.service");

exports.getForecast = async () => {
  const trends = await getTrends();
  const values = Object.values(trends);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { nextMonthPrediction: average };
};