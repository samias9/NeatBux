const { getTransactions } = require("./data.service");

exports.getTrends = async () => {
  const transactions = await getTransactions();
  const trends = {};
  transactions.forEach(t => {
    const month = t.date.slice(0, 7);
    trends[month] = (trends[month] || 0) + t.amount;
  });
  return trends;
};