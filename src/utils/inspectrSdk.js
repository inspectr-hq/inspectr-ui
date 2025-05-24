// src/utils/inspectrSdk.js
export async function registerApi(apiEndpoint, body) {
  // Normalize the endpoint by removing trailing slashes
  const normalizedEndpoint = apiEndpoint.replace(/\/+$/, '');
  const res = await fetch(`${normalizedEndpoint}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "inspectr-client": "inspectr-app",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Registration failed (${res.status})`);
  return await res.json();
}

export async function getConfigApi() {
  const res = await fetch("/app/config");
  if (!res.ok) throw new Error(`Config load failed (${res.status})`);
  return await res.json();
}

export async function deleteAllOperationsApi(apiEndpoint) {
  // Normalize the endpoint by removing trailing slashes
  const normalizedEndpoint = apiEndpoint.replace(/\/+$/, '');
  const res = await fetch(`${normalizedEndpoint}/operations`, {
    method: "DELETE",
    headers: { "inspectr-client": "inspectr-app" },
  });
  if (!res.ok) throw new Error(`Delete all failed (${res.status})`);
}

export async function deleteOperationApi(apiEndpoint, id) {
  // Normalize the endpoint by removing trailing slashes
  const normalizedEndpoint = apiEndpoint.replace(/\/+$/, '');
  const res = await fetch(`${normalizedEndpoint}/operations/${id}`, {
    method: "DELETE",
    headers: { "inspectr-client": "inspectr-app" },
  });
  if (!res.ok) throw new Error(`Delete ${id} failed (${res.status})`);
}
