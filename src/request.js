export const post = async (url = '', data = {}) => {

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify(data),
    });
    return response.json();
  }
  