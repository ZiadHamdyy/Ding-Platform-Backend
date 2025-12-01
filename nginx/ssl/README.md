# SSL Certificate Placeholder

This directory should contain your SSL/TLS certificates for production deployment.

## For Development

You can use self-signed certificates:

```bash
# Generate self-signed certificate (for testing only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## For Production

### Option 1: Let's Encrypt (Recommended)

Use Certbot to obtain free SSL certificates:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Option 2: Commercial Certificate

1. Purchase SSL certificate from a trusted CA
2. Place the certificate files in this directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key
   - `chain.pem` - Certificate chain (optional)

### Option 3: Use Docker Certbot

Add certbot service to docker-compose.prod.yml:

```yaml
certbot:
  image: certbot/certbot
  volumes:
    - ./certbot/conf:/etc/letsencrypt
    - ./certbot/www:/var/www/certbot
  entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

## File Permissions

Ensure proper permissions:

```bash
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem
```

## Security Notes

- **Never commit private keys to version control**
- Add `*.pem` to `.gitignore`
- Rotate certificates before expiration
- Use strong key lengths (minimum 2048-bit RSA or 256-bit ECDSA)
