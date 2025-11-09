import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Projects
export const createProject = async (projectData) => {
  const response = await axios.post(
    `${API_URL}/projects`,
    projectData,
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getProjects = async () => {
  const response = await axios.get(
    `${API_URL}/projects`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getProject = async (projectId) => {
  const response = await axios.get(
    `${API_URL}/projects/${projectId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

// Social Promotion
export const authorizeShare = async (projectId, platforms) => {
  const response = await axios.post(
    `${API_URL}/social/authorize`,
    { project_id: projectId, platforms },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const revokeAuthorization = async (projectId) => {
  const response = await axios.post(
    `${API_URL}/social/revoke`,
    { project_id: projectId },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getShareLinks = async (projectId) => {
  const response = await axios.get(
    `${API_URL}/social/links/${projectId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getProjectStats = async (projectId) => {
  const response = await axios.get(
    `${API_URL}/social/stats/${projectId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const trackEvent = async (projectId, platform, eventType) => {
  const response = await axios.post(
    `${API_URL}/social/track`,
    { project_id: projectId, platform, event_type: eventType }
  );
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await axios.get(`${API_URL}/leaderboard`);
  return response.data;
};

export const getAuthorizations = async () => {
  const response = await axios.get(
    `${API_URL}/social/authorizations`,
    { headers: getAuthHeader() }
  );
  return response.data;
};