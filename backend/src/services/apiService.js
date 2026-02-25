import axios from 'axios';

const BASE_URL = 'https://api.cinemango.org';

export async function fetchWorks() {
  const response = await axios.get(`${BASE_URL}/api/works`);
  return response.data.data;
}
