import api from "./api";

const getMonthlyReport = async (token, month, year) => {
  const response = await api.get("/reports/monthly", {
    params: {
      month,
      year,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default {
  getMonthlyReport,
};
