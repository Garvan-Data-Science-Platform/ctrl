import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { app } from '../src/index';

describe('GET /workspaces', () => {
  it('should return a list of workspaces', async () => {
    // Perform a GET request to your endpoint
    const response = await request(app).get('/workspaces');

    // Check if the response is as expected
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { name: 'backend', version: '1.0.0' },
      { name: 'common', version: '1.0.0' },
      { name: 'frontend', version: '1.0.0' },
    ]);
  });
});
