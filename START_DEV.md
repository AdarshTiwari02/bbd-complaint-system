# 🚀 Quick Start Guide - Hybrid Development

## ✅ Infrastructure Status

Infrastructure services are running in Docker:
- ✅ PostgreSQL: `localhost:5432`
- ✅ Redis: `localhost:6379`
- ✅ MinIO: `localhost:9000` (Console: `localhost:9001`)

## 🗄️ Database Setup

Database has been initialized with:
- ✅ Migrations applied
- ✅ Seed data loaded (admin user created)

## 🎯 Starting Applications

Open **3 separate terminal windows** and run:

### Terminal 1: Backend API
```bash
cd apps/backend
pnpm run dev
```
Backend will run on: **http://localhost:3001**

### Terminal 2: AI Service
```bash
cd apps/ai-service
pnpm run dev
```
AI Service will run on: **http://localhost:3002**

### Terminal 3: Frontend
```bash
cd apps/frontend
pnpm run dev
```
Frontend will run on: **http://localhost:5173**

---

## 🌐 Access Points

Once all services are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **API Documentation**: http://localhost:3001/api/docs
- **AI Service**: http://localhost:3002
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

---

## 👤 Default Admin Login

- **Email**: `admin@bbdu.edu.in`
- **Password**: `Admin@123`

---

## 🔧 Troubleshooting

### Port Already in Use
If a port is already in use, you can:
1. Stop the conflicting service
2. Or change the port in the app's configuration

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Reset Database
```bash
# Reset and reseed
npx prisma migrate reset
npx prisma db seed
```

### Stop Infrastructure
```bash
docker-compose down
```

### Start Infrastructure Again
```bash
docker-compose up -d postgres redis minio
```

---

## 📝 Development Tips

1. **Hot Reload**: All apps support hot reload - changes will auto-refresh
2. **API Testing**: Use Swagger UI at http://localhost:3001/api/docs
3. **Database**: Use Prisma Studio to view/edit data:
   ```bash
   npx prisma studio
   ```
4. **Logs**: Check terminal output for each service

---

## 🎉 You're Ready!

Start the three terminals and begin development!



