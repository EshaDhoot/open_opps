#!/bin/bash

# Run PostgreSQL in Docker
docker run --name job-aggregator-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=job_aggregator \
  -p 5432:5432 \
  -d postgres:14
