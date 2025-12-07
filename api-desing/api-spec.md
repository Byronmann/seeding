# 📡 API Specification – Apple Music Analytics  
**Autor:** Byron Rodolfo Maldonado Palacios  
**Proyecto:** Examen Final – Bases de Datos II  
**Stack:** Node.js + MongoDB + Aggregation Pipelines  

---

# 🧩 Overview  
Esta API provee cinco endpoints REST que permiten al Dashboard de Apple Music consultar analíticas de streaming en tiempo real basadas en MongoDB.

Cada endpoint corresponde directamente a uno de los cinco Aggregation Pipelines desarrollados en `database/queries.js`.

---

# 1️⃣ GET /api/royalties?days=30  
### **Descripción:**  
Devuelve el tiempo total de reproducción (en segundos) por artista durante los últimos `days` días.

### **Parámetros:**  
| Query | Tipo | Descripción |
|-------|------|-------------|
| `days` | number | Rango de días hacia atrás (default: 30) |

### **Respuesta JSON:**
```json
[
  { "artist": "Bad Bunny", "totalSeconds": 178051 },
  { "artist": "Metallica", "totalSeconds": 99228 }
]
