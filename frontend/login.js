const form = document.getElementById('loginForm');
const message = document.getElementById('message');

// ========== DEPLOYED BACKEND API ==========
const API_URL = 'https://YOUR-ACTUAL-RENDER-URL.onrender.com/api';

form.addEventListener('submit', async (e) => {
  e.preventDefault(); // Stop page reload

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();
    console.log(data);

    if (data.success) {
      message.className = 'success';
      message.textContent = data.message;

      // Save user info in localStorage
      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      // Redirect to homepage after 1 second
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);

    } else {
      message.className = 'error';
      message.textContent = data.message;
    }

  } catch (err) {
    console.error(err);

    message.className = 'error';
    message.textContent = "Server not reachable";
  }
});