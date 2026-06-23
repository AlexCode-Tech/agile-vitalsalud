const token = 'sk_16600.qyEkRmvwIUSrVQpEtYOiSoXNG4Ty6vx4';
const dni = '76158376';
const url = `http://api.decolecta.com/v1/reniec/dni?numero=${dni}`;

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
