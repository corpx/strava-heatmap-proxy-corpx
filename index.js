export default {
  async fetch(request, env) {
    const apiUrl = "https://api.example.com/data"; 
    const apiKey = env.API_KEY; // Access the API key securely as a secret
    return new Response("Internal Server Error" + env.API_KEY, { status: 200 });

    try {
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${apiKey}` 
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Fetch request failed:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}
