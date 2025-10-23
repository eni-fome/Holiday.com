# Deployment Security Checklist

## Pre-Deployment

### Environment Variables
- [ ] All secrets moved to environment variables
- [ ] `.env` files NOT committed to git
- [ ] Production secrets different from development
- [ ] JWT_SECRET_KEY is strong (min 32 characters)
- [ ] Database credentials are secure

### Code Security
- [ ] All dependencies updated (`npm audit` clean)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

### Database
- [ ] MongoDB authentication enabled
- [ ] Database user has minimal required permissions
- [ ] Connection string uses SSL/TLS
- [ ] Indexes created for performance

### API Security
- [ ] CORS configured with specific origins
- [ ] HTTPS enforced in production
- [ ] Security headers configured (Helmet)
- [ ] File upload limits set
- [ ] Request size limits set

## Production Environment

### Required Environment Variables
```bash
NODE_ENV=production
MONGODB_CONNECTION_STRING=<production-db-url>
JWT_SECRET_KEY=<strong-secret-key>
FRONTEND_URL=<production-frontend-url>
STRIPE_API_KEY=<production-stripe-key>
CLOUDINARY_CLOUD_NAME=<cloudinary-name>
CLOUDINARY_API_KEY=<cloudinary-key>
CLOUDINARY_API_SECRET=<cloudinary-secret>
```

### Server Configuration
- [ ] NODE_ENV set to 'production'
- [ ] Secure cookies enabled (HTTPS)
- [ ] Process manager configured (PM2/systemd)
- [ ] Logging configured
- [ ] Error monitoring setup (Sentry, etc.)

### Frontend Configuration
- [ ] API base URL points to production
- [ ] Source maps disabled or secured
- [ ] Console logs removed
- [ ] Analytics configured

## Post-Deployment

### Verification
- [ ] HTTPS working correctly
- [ ] CSRF tokens working
- [ ] Rate limiting active
- [ ] Authentication flow working
- [ ] Payment processing working
- [ ] File uploads working
- [ ] Error handling working

### Monitoring
- [ ] Server logs accessible
- [ ] Error tracking active
- [ ] Performance monitoring setup
- [ ] Uptime monitoring configured

### Backup
- [ ] Database backup strategy in place
- [ ] Backup restoration tested
- [ ] Environment variables backed up securely

## Regular Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check for failed login attempts
- [ ] Monitor API usage patterns

### Monthly
- [ ] Update dependencies (`npm audit fix`)
- [ ] Review and rotate API keys if needed
- [ ] Check database performance
- [ ] Review rate limit effectiveness

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review access controls
- [ ] Update security documentation
