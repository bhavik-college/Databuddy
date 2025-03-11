
export async function subscribeToEarlyAccess(email: string) {
  const response = await fetch("/api/earlyaccess", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    return { error: errorData.error, status: response.status };
  }

  return { success: true, status: response.status };
}

