import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { get } from 'env-var';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: ReturnType<typeof neo4j.driver>;

  async onModuleInit() {
    const uri = get('NEO4J_URI').default('bolt://localhost:7687').asString();
    
    // Support both NEO4J_AUTH (username/password) and individual variables
    let username: string;
    let password: string;
    
    const neo4jAuth = get('NEO4J_AUTH').asString();
    if (neo4jAuth) {
      // Parse NEO4J_AUTH format: username/password
      const [authUsername, authPassword] = neo4jAuth.split('/');
      if (!authUsername || !authPassword) {
        throw new Error('NEO4J_AUTH must be in format: username/password');
      }
      username = authUsername;
      password = authPassword;
    } else {
      // Fall back to individual variables
      username = get('NEO4J_USERNAME').default('neo4j').asString();
      password = get('NEO4J_PASSWORD').required().asString();
    }

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

    // Retry connection with exponential backoff
    const maxRetries = 5;
    const baseDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.driver.verifyConnectivity();
        console.log('Neo4j connected successfully');
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          console.error('Failed to connect to Neo4j after', maxRetries, 'attempts:', error);
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Neo4j connection attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
      console.log('Neo4j connection closed');
    }
  }

  getDriver(): ReturnType<typeof neo4j.driver> {
    return this.driver;
  }

  getSession(database?: string): Session {
    return this.driver.session({
      database: database || 'neo4j',
    });
  }
}

