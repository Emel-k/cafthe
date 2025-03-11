// const request = require('supertest');
// const express = require('express');
// const routeModule = require('../endpoint');
// const db = require('../db.test'); // Make sure this is used correctly, or mock it if necessary
//
// const app = express();
// app.use(express.json());
// app.use('/api', routeModule);
//
// describe('Endpoints pour les produits', () => {
//     test('GET /api/produits devrait retourner tous les produits', async () => {
//         // Await the request to ensure you get the response properly
//         const response = await request(app).get('/api/produits/');
//
//         expect(response.status).toBe(200);
//         expect(Array.isArray(response.body)).toBe(true);
//         expect(response.body.length).toBeGreaterThan(0);
//     });
//
//     test('GET /api/produits/details/:id devrait retourner la fiche produit', async () => {
//         // Await the request to ensure you get the response properly
//         const productId = 2;
//         const response = await request(app).get(`/api/produits/details/${productId}`);
//
//         expect(response.status).toBe(200);
//         expect(response.body[0]).toHaveProperty('produitsID');
//
//     });
// });
