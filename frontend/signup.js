const form = document.getElementById('signupForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://localhost:5000/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      message.className = 'success';
      message.textContent = data.message;

      // Redirect to login page after 1 second
      setTimeout(() => {
        window.location.href = "login.html";
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