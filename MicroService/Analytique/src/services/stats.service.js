const { getTransactions } = require("./data.service");

exports.computeStats = async () => {
  const transactions = await getTransactions();
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const average = total / transactions.length;
  return { total, average };
};