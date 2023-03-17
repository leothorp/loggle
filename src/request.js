export const post = async (url = '', data = {}) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        body: JSON.stringify(data),
      });
      return response.json();
    } catch (error) {
      console.log(
        "An error occurred during POST to the log sink endpoint: ",
        error
      );
    }
  }
  