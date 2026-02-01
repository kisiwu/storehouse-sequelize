## Health check

```ts
import { HealthCheckResult } from '@storehouse/core/lib/manager';

export class SequelizeManager extends Sequelize implements IManager {
  // ... existing code ...

  isConnected(): boolean {
    try {
      // Check if connection exists and has a valid dialect
      return !!this.connectionManager && this.connectionManager.hasOwnProperty('pool');
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    const timestamp = start;

    try {
      // Authenticate the connection
      await this.authenticate();
      
      const latency = Date.now() - start;
      
      // Get connection info
      const dialect = this.getDialect();
      const models = Object.keys(this.models);
      
      return {
        healthy: true,
        message: 'Sequelize connection is healthy',
        details: {
          name: this.name,
          dialect,
          databaseVersion: await this.databaseVersion(),
          models,
          modelCount: models.length,
          latency: `${latency}ms`
        },
        latency,
        timestamp
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Sequelize health check failed: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          name: this.name,
          dialect: this.getDialect(),
          error: error instanceof Error ? error.stack : String(error)
        },
        latency: Date.now() - start,
        timestamp
      };
    }
  }
}
```

## Import Custom Error Classes

```ts
import { 
  IManager, 
  ManagerArg,
  HealthCheckResult 
} from '@storehouse/core/lib/manager';
import { Registry } from '@storehouse/core/lib/registry';
import { 
  ModelNotFoundError,
  ManagerNotFoundError,
  InvalidManagerConfigError
} from '@storehouse/core/lib/errors';
import {
  Sequelize,
  Model, 
  ModelAttributes, 
  ModelOptions,
  Options,
  ModelStatic
} from 'sequelize';
import Logger from '@novice1/logger';

function getMdl<M extends Model = Model>(registry: Registry, managerName: string, modelName?: string): ModelStatic<M>;
function getMdl<M extends ModelStatic<Model> = ModelStatic<Model>>(registry: Registry, managerName: string, modelName?: string): M;
function getMdl<TModelAttributes extends Record<string, unknown> = typeof AnyJson, TCreationAttributes extends Record<string, unknown> = typeof AnyJson>(registry: Registry, managerName: string, modelName?: string): ModelStatic<Model<TModelAttributes, TCreationAttributes>>;
function getMdl<M extends Model = Model>(registry: Registry, managerName: string, modelName?: string): ModelStatic<M> {
  const model = registry.getModel<ModelStatic<M>>(managerName, modelName);
  if (!model) {
    throw new ModelNotFoundError(
      modelName || managerName,
      modelName ? managerName : undefined
    );
  }
  return model;
}

export function getManager<M extends SequelizeManager = SequelizeManager>(
  registry: Registry, 
  managerName?: string
): M {
  const manager = registry.getManager<M>(managerName);
  if (!manager) {
    throw new ManagerNotFoundError(managerName || registry.defaultManager);
  }
  if (!(manager instanceof SequelizeManager)) {
    throw new InvalidManagerConfigError(
      `Manager "${managerName || registry.defaultManager}" is not instance of SequelizeManager`
    );
  }
  return manager;
}

export function getConnection(registry: Registry, managerName?: string): Sequelize {
  const conn = registry.getConnection<Sequelize>(managerName);
  if (!conn) {
    throw new ManagerNotFoundError(managerName || registry.defaultManager);
  }
  return conn;
}
```