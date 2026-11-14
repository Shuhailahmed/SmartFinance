import api from "./api";

const globalSearch = async (query) => {
  const response = await api.get("/search", {
    params: { q: query },
  });

  return response.data;
};

const searchService = {
  globalSearch,
};

export default searchService;
