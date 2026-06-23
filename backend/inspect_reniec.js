require('dotenv').config();
const token = process.env.RENIEC_API_TOKEN;

if (!token) {
  throw new Error('RENIEC_API_TOKEN no está configurado.');
}
const dni = '76158376';
const url = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;

fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
})
.then(async response => {
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Data:', JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('Error:', err);
});
