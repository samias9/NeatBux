// Simulation de transactions récupérées depuis MongoDB
exports.getTransactions = async () => {
  return [
    { amount: 120, date: "2025-01-10" },
    { amount: 250, date: "2025-01-15" },
    { amount: 75, date: "2025-02-05" },
    { amount: 190, date: "2025-02-20" },
    { amount: 210, date: "2025-03-10" },
  ];
};
