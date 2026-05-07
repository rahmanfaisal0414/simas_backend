const callArimaForecast = async ({ values, steps = 7, order = [1, 1, 1] }) => {
    const baseUrl = process.env.AI_SERVICE_URL;
  
    if (!baseUrl) {
      throw new Error('AI_SERVICE_URL belum diset');
    }
  
    const response = await fetch(`${baseUrl}/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
        steps,
        order,
      }),
    });
  
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI service error: ${text}`);
    }
  
    return response.json();
  };
  
  module.exports = {
    callArimaForecast,
  };