// services/api.ts
import axios from 'axios';

// ATENÇÃO: Substitua o IP pelo endereço IP da máquina onde o Dev 2 está rodando a API.
// Para encontrar o IP: no Windows, abra o CMD e digite `ipconfig`. No Mac/Linux, `ifconfig`.
// Certifique-se de que ambos os computadores (ou o computador e o celular) estejam na mesma rede Wi-Fi.
const API_URL = 'http://192.168.0.107:3001/api'; // EXEMPLO! MUDE ESTE IP.

const api = axios.create({
  baseURL: API_URL,
});

export default api;