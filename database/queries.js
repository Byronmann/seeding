/**
 * ==========================================================
 * AGGREGATION PIPELINES – APPLE MUSIC (Examen Final)
 * Autor: Byron Rodolfo Maldonado Palacios
 * Universidad Da Vinci — Bases de Datos II
 * ==========================================================
 *
 * Este archivo contiene las 5 consultas de negocio solicitadas:
 * 1. Regalías por artista (último mes)
 * 2. Top 10 canciones más reproducidas en Guatemala (últimos 7 días)
 * 3. Usuarios Premium "Zombis"
 * 4. Distribución demográfica por edades (oyentes de Reggaeton)
 * 5. Heavy Users de Bad Bunny (usuarios que escucharon más canciones distintas)
 *
 * NOTA:
 * - Las consultas 1, 2, 4 y 5 se ejecutan sobre la colección "streams".
 * - La consulta 3 se ejecuta sobre la colección "users".
 */

const queries = {
  // ---------------------------------------------------------
  // 1. REGALÍAS POR ARTISTA (Último mes)
  // Pregunta:
  //  "¿Cuánto tiempo total (en segundos) se ha reproducido
  //   cada artista en el último mes?"
  //
  // Colecciones usadas:
  //  - streams (root)
  //  - songs (para obtener artist_name y duración)
  //
  // Ejecución:
  //  db.streams.aggregate(queries.royaltiesLastMonth)
  // ---------------------------------------------------------
  royaltiesLastMonth: [
    {
      $match: {
        date: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 días
        }
      }
    },
    {
      $lookup: {
        from: "songs",
        localField: "song_id",
        foreignField: "_id",
        as: "song"
      }
    },
    { $unwind: "$song" },
    {
      $group: {
        _id: "$song.artist_name",
        totalSeconds: { $sum: "$seconds_played" }
      }
    },
    { $sort: { totalSeconds: -1 } }
  ],

  // ---------------------------------------------------------
  // 2. TOP 10 DE GUATEMALA (últimos 7 días)
  // Pregunta:
  //  "¿Cuáles son las 10 canciones más escuchadas en
  //   'Guatemala' en los últimos 7 días?"
  //
  // Colecciones usadas:
  //  - streams (root)
  //  - users (para filtrar country = 'GT')
  //  - songs (para mostrar título y artista)
  //
  // Ejecución:
  //  db.streams.aggregate(queries.top10Guatemala)
  // ---------------------------------------------------------
  top10Guatemala: [
    {
      $match: {
        date: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // últimos 7 días
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $match: {
        "user.country": "GT"
      }
    },
    {
      $group: {
        _id: "$song_id",
        totalReproductions: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: "songs",
        localField: "_id",
        foreignField: "_id",
        as: "song"
      }
    },
    { $unwind: "$song" },
    {
      $project: {
        _id: 0,
        songId: "$_id",
        title: "$song.title",
        artist: "$song.artist_name",
        totalReproductions: 1
      }
    },
    { $sort: { totalReproductions: -1 } },
    { $limit: 10 }
  ],

  // ---------------------------------------------------------
  // 3. USUARIOS PREMIUM ZOMBIS
  // Pregunta:
  //  "Listar usuarios que tienen suscripción 'Premium' activa,
  //   pero que NO han reproducido ninguna canción en los
  //   últimos 30 días."
  //
  // Colecciones usadas:
  //  - users (root)
  //  - streams (actividad)
  //
  // Ejecución:
  //  db.users.aggregate(queries.premiumZombies)
  // ---------------------------------------------------------
  premiumZombies: [
    {
      $match: {
        subscription: "Premium"
      }
    },
    {
      $lookup: {
        from: "streams",
        localField: "_id",
        foreignField: "user_id",
        as: "activity"
      }
    },
    {
      $addFields: {
        recentActivity: {
          $filter: {
            input: "$activity",
            as: "stream",
            cond: {
              $gte: [
                "$$stream.date",
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 días
              ]
            }
          }
        }
      }
    },
    {
      $match: {
        recentActivity: { $size: 0 } // sin streams recientes
      }
    },
    {
      $project: {
        _id: 0,
        username: 1,
        email: 1,
        country: 1,
        subscription: 1,
        status: {
          $literal: "ZOMBIE"
        }
      }
    }
  ],

  // ---------------------------------------------------------
  // 4. DEMOGRAFÍA POR EDAD – Oyentes de Reggaeton
  // Pregunta:
  //  "De todos los usuarios que escuchan 'Reggaeton',
  //   ¿cuál es la distribución por edades?"
  //
  // Colecciones usadas:
  //  - streams (root)
  //  - songs (para filtrar genre = 'Reggaeton')
  //  - users (para edad / birth_date)
  //
  // Ejecución:
  //  db.streams.aggregate(queries.reggaetonDemographics)
  // ---------------------------------------------------------
  reggaetonDemographics: [
    {
      $lookup: {
        from: "songs",
        localField: "song_id",
        foreignField: "_id",
        as: "song"
      }
    },
    { $unwind: "$song" },
    {
      $match: {
        "song.genre": "Reggaeton"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $addFields: {
        age: {
          $dateDiff: {
            startDate: "$user.birth_date",
            endDate: "$$NOW",
            unit: "year"
          }
        }
      }
    },
    {
      $bucket: {
        groupBy: "$age",
        boundaries: [15, 21, 31, 41, 61], // 15-20, 21-30, 31-40, 41-60, 61+
        default: "Fuera de rango",
        output: {
          totalListeners: { $sum: 1 },
          avgAge: { $avg: "$age" }
        }
      }
    }
  ],

  // ---------------------------------------------------------
  // 5. HEAVY USERS — BAD BUNNY
  // Pregunta:
  //  "Encontrar a los 5 usuarios que más canciones
  //   distintas han escuchado del artista 'Bad Bunny'."
  //
  // Colecciones usadas:
  //  - streams (root)
  //  - songs (para filtrar artist_name = 'Bad Bunny')
  //
  // Ejecución:
  //  db.streams.aggregate(queries.heavyUsersBadBunny)
  // ---------------------------------------------------------
  heavyUsersBadBunny: [
    {
      $lookup: {
        from: "songs",
        localField: "song_id",
        foreignField: "_id",
        as: "song"
      }
    },
    { $unwind: "$song" },
    {
      $match: {
        "song.artist_name": "Bad Bunny"
      }
    },
    {
      $group: {
        _id: "$user_id",
        uniqueSongs: { $addToSet: "$song_id" }
      }
    },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        totalDistinctSongs: { $size: "$uniqueSongs" }
      }
    },
    { $sort: { totalDistinctSongs: -1 } },
    { $limit: 5 }
  ]
};

module.exports = { queries };
