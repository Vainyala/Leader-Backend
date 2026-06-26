# leaderapp-backoffice-mongodb--- Fully working version developed on 2nd Aug 2025 with Gmail integration which is not working. Planning to integrate own nutantek.com email service in the next version.

# This working code is baselined for reference purpose Tech stack: Nodejs, expressjs & mongodb with multer for multipart upload/downloads of image files

# 🔐 LeaderApp Auth API

This API supports secure user onboarding with OTP verification, JWT-based authentication, and refresh tokens with TTL-based cleanup.  

---

## 🚦 Auth Lifecycle Flow
1. `verify-email` → Initiates flow for unregistered emails  
2. `send-otp` → Manually trigger OTP (if user retries)  
3. `verify-otp` → Validates the email OTP  
4. `register` → Creates new user  
5. `login` → Issues access/refresh tokens  
6. `refresh-token` → Refreshes access token  
7. `logout` → Deletes refresh token  

---

## 🧪 Testing Setup

- Environment: `leaderapp_dev`
- Run tests manually with:
```bash
npm run simulate:ttl   # For TTL cleanup test
npm run test:authFlow  # For full Postman auth flow

# For Swagger Testing:


Now, when your server is running, head over to http://localhost:3000/docs and you’ll see your interactive Swagger UI 🎉
4. Annotate Your Routes (Optional but Powerful)
Use JSDoc-style comments above each route for auto-generation. Example for /auth/register:
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: User registered
 */
router.post('/register', registerHandler);



🚀 Bonus Tips
- Use swagger-jsdoc with your controllers + routes for auto-syncing.
- Bundle your YAML spec separately if you want to keep docs modular.
- Protect your /docs route in production with basic auth or IP whitelisting.
Would you like me to help scaffold the annotated route files next, or plug in the RegisterRequest schema from your spec into the auto-doc comments? We can get it production-polished in no time.
