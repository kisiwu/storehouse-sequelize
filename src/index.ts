import { HealthCheckResult, IManager, InvalidManagerConfigError, ManagerArg, ManagerNotFoundError, ModelNotFoundError, Registry } from '@storehouse/core';
import {
  Sequelize,
  Model,
  ModelAttributes,
  ModelOptions,
  Options,
  ModelStatic
} from 'sequelize';
import Logger from '@novice1/logger';

const Log = Logger.debugger('@storehouse/sequelize');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyJsonObject = { [key: string]: any };

/**
 * Configuration settings for a Sequelize model.
 * Defines the attributes, model class, and options for a single model.
 *
 * @template TModelAttributes - The model attributes type, defaults to any JSON object
 * @template TCreationAttributes - The creation attributes type, defaults to TModelAttributes
 *
 * @example
 * ```typescript
 * const userModelSettings: ModelSettings = {
 *   attributes: {
 *     id: {
 *       type: DataTypes.INTEGER,
 *       primaryKey: true,
 *       autoIncrement: true
 *     },
 *     name: {
 *       type: DataTypes.STRING,
 *       allowNull: false
 *     },
 *     email: {
 *       type: DataTypes.STRING,
 *       unique: true
 *     }
 *   },
 *   options: {
 *     modelName: 'User',
 *     tableName: 'users'
 *   }
 * };
 * ```
 */
export interface ModelSettings<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TModelAttributes extends AnyJsonObject = any,
  TCreationAttributes extends AnyJsonObject = TModelAttributes> {
  /** The model attribute definitions */
  attributes: ModelAttributes<Model<TModelAttributes, TCreationAttributes>, TModelAttributes>;
  /** Optional pre-defined model class that extends Sequelize Model */
  model?: ModelStatic<Model<TModelAttributes, TCreationAttributes>>;
  /** Model configuration options such as tableName, timestamps, etc. */
  options?: ModelOptions<Model<TModelAttributes, TCreationAttributes>>;
}

/**
 * Configuration settings for creating a SequelizeManager instance.
 *
 * @example
 * ```typescript
 * const config: SequelizeManagerSettings = {
 *   options: {
 *     dialect: 'postgres',
 *     host: 'localhost',
 *     port: 5432,
 *     database: 'mydb',
 *     username: 'user',
 *     password: 'password',
 *     pool: {
 *       max: 5,
 *       min: 0,
 *       acquire: 30000,
 *       idle: 10000
 *     }
 *   },
 *   models: [userModelSettings, postModelSettings]
 * };
 * ```
 */
export interface SequelizeManagerSettings {
  /** Sequelize connection and configuration options */
  options?: Options;
  /** Array of model definitions to register with the Sequelize instance */
  models?: ModelSettings[]
}

/**
 * Configuration argument for creating a SequelizeManager instance.
 *
 * @extends ManagerArg
 *
 * @example
 * ```typescript
 * const managerArg: SequelizeManagerArg = {
 *   name: 'my-sequelize-manager',
 *   config: {
 *     options: {
 *       dialect: 'mysql',
 *       host: 'localhost',
 *       database: 'myapp',
 *       username: 'root',
 *       password: 'password'
 *     },
 *     models: [...]
 *   }
 * };
 * ```
 */
export interface SequelizeManagerArg extends ManagerArg {
  /**
   * Sequelize manager configuration including connection options and models.
   * See SequelizeManagerSettings for details.
   */
  config?: SequelizeManagerSettings;
}

/**
 * Retrieves a Sequelize model from the registry.
 *
 * @template M - The Model type to return, defaults to Model
 *
 * @param registry - The Storehouse registry containing registered managers
 * @param modelName - The name of the model to retrieve
 *
 * @returns The requested ModelStatic instance
 *
 * @throws {ModelNotFoundError} If the model is not found in the registry
 *
 * @example
 * ```typescript
 * const User = getModel(registry, 'User');
 * const users = await User.findAll();
 * ```
 */
export function getModel<M extends Model = Model>(registry: Registry, modelName: string): ModelStatic<M>;
/**
 * Retrieves a Sequelize model from a specific manager in the registry.
 *
 * @template M - The Model type to return, defaults to Model
 *
 * @param registry - The Storehouse registry containing registered managers
 * @param managerName - The name of the manager to retrieve the model from
 * @param modelName - The name of the model to retrieve
 *
 * @returns The requested ModelStatic instance
 *
 * @throws {ModelNotFoundError} If the model is not found in the specified manager
 *
 * @example
 * ```typescript
 * const User = getModel(registry, 'primary-db', 'User');
 * const user = await User.findByPk(1);
 * ```
 */
export function getModel<M extends Model = Model>(registry: Registry, managerName: string, modelName: string): ModelStatic<M>;
export function getModel<M extends ModelStatic<Model> = ModelStatic<Model>>(registry: Registry, modelName: string): M;
export function getModel<M extends ModelStatic<Model> = ModelStatic<Model>>(registry: Registry, managerName: string, modelName: string): M;
export function getModel<TModelAttributes extends Record<string, unknown> = AnyJsonObject, TCreationAttributes extends Record<string, unknown> = AnyJsonObject>(registry: Registry, modelName: string): ModelStatic<Model<TModelAttributes, TCreationAttributes>>;
export function getModel<TModelAttributes extends Record<string, unknown> = AnyJsonObject, TCreationAttributes extends Record<string, unknown> = AnyJsonObject>(registry: Registry, managerName: string, modelName: string): ModelStatic<Model<TModelAttributes, TCreationAttributes>>;
export function getModel<M extends Model = Model>(registry: Registry, managerName: string, modelName?: string): ModelStatic<M> {
  const model = registry.getModel<ModelStatic<M>>(managerName, modelName);
  if (!model) {
    throw new ModelNotFoundError(
      modelName || managerName,
      modelName ? managerName : undefined
    );
  }
  return model;
}

/**
 * Retrieves a SequelizeManager instance from the registry.
 *
 * @template M - The specific SequelizeManager type to return, defaults to SequelizeManager
 *
 * @param registry - The Storehouse registry containing registered managers
 * @param managerName - Optional name of the manager to retrieve. If omitted, retrieves the default manager
 *
 * @returns The requested SequelizeManager instance
 *
 * @throws {ManagerNotFoundError} If the manager is not found in the registry
 * @throws {InvalidManagerConfigError} If the manager exists but is not an instance of SequelizeManager
 *
 * @example
 * ```typescript
 * const sequelizeManager = getManager(registry, 'primary-db');
 * const connection = sequelizeManager.getConnection();
 * await connection.query('SELECT 1');
 * ```
 */
export function getManager<M extends SequelizeManager = SequelizeManager>(registry: Registry, managerName?: string): M {
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

/**
 * Retrieves a Sequelize connection instance from a manager in the registry.
 *
 * @param registry - The Storehouse registry containing registered managers
 * @param managerName - Optional name of the manager. If omitted, uses the default manager
 *
 * @returns The Sequelize connection instance
 *
 * @throws {ManagerNotFoundError} If the manager is not found in the registry
 * @throws {InvalidManagerConfigError} If the connection is not an instance of Sequelize
 *
 * @example
 * ```typescript
 * const sequelize = getConnection(registry, 'primary-db');
 * const [results] = await sequelize.query('SELECT * FROM users WHERE active = ?', {
 *   replacements: [true],
 *   type: QueryTypes.SELECT
 * });
 * ```
 */
export function getConnection(registry: Registry, managerName?: string): Sequelize {
  const conn = registry.getConnection<Sequelize>(managerName);
  if (!conn) {
    throw new ManagerNotFoundError(managerName || registry.defaultManager);
  }
  if (!(conn instanceof Sequelize)) {
    throw new InvalidManagerConfigError(
      `Connection "${managerName || registry.defaultManager}" is not instance of Sequelize`
    );
  }
  return conn;
}

/**
 * Extended health check result specific to Sequelize managers.
 * Includes database connection details, model information, and query response time.
 *
 * @extends HealthCheckResult
 */
export interface SequelizeHealthCkeckResult extends HealthCheckResult {
  /**
   * Detailed information about the Sequelize connection health.
   */
  details: {
    /** The name of the manager */
    name: string;
    /** The database dialect (mysql, postgres, sqlite, etc.) */
    dialect: string;
    /** The version of the connected database */
    databaseVersion?: string;
    /** Array of registered model names */
    models?: string[];
    /** Total count of registered models */
    modelCount?: number;
    /** Time taken to perform the health check query in milliseconds */
    latency?: string;
    /** Error message or stack trace if the health check failed */
    error?: string;
    /** Additional custom properties */
    [key: string]: unknown;
  };
}

/**
 * Manager class for Sequelize ORM integration with Storehouse.
 * Provides connection management, model registration, and health checking for SQL databases
 * supported by Sequelize (PostgreSQL, MySQL, SQLite, MariaDB, SQL Server, etc.).
 *
 * This manager extends the Sequelize class, offering a unified interface
 * for working with relational databases through the Storehouse registry system.
 *
 * @extends Sequelize
 * @implements {IManager}
 *
 * @example
 * ```typescript
 * const manager = new SequelizeManager({
 *   name: 'primary-db',
 *   config: {
 *     options: {
 *       dialect: 'postgres',
 *       host: 'localhost',
 *       port: 5432,
 *       database: 'myapp',
 *       username: 'postgres',
 *       password: 'password',
 *       logging: console.log,
 *       pool: {
 *         max: 5,
 *         min: 0,
 *         acquire: 30000,
 *         idle: 10000
 *       }
 *     },
 *     models: [
 *       {
 *         attributes: {
 *           id: { type: DataTypes.INTEGER, primaryKey: true },
 *           name: { type: DataTypes.STRING }
 *         },
 *         options: { modelName: 'User' }
 *       }
 *     ]
 *   }
 * });
 *
 * const User = manager.getModel('User');
 * const users = await User.findAll();
 * ```
 */
export class SequelizeManager extends Sequelize implements IManager {
  /**
   * Identifier for the manager type.
   * @readonly
   */
  static readonly type = '@storehouse/sequelize';

  /**
   * The name of this manager instance.
   * @protected
   */
  protected name: string;

  /**
   * Creates a new SequelizeManager instance.
   *
   * @param settings - Configuration settings for the manager
   *
   * @remarks
   * The Sequelize connection is created immediately and models are initialized.
   * If logging is not specified in options, it defaults to debug logging via @novice1/logger.
   * Models can be initialized either by providing a pre-defined model class or by
   * defining attributes and options directly.
   */
  constructor(settings: SequelizeManagerArg) {
    let options: Options = {};

    if (settings.config?.options) {
      options = {
        ...settings.config.options
      };
    }

    if (typeof options.logging === 'undefined') {
      options.logging = msg => Log.debug(`[${this.name}]`, msg);
    }

    super(options);

    this.name = settings.name || `Sequelize ${Date.now()}_${Math.ceil(Math.random() * 10000) + 10}`;

    settings.config?.models?.forEach(m => {
      if (m.model && m.model.init) {
        const options = {
          ...m.options,
          sequelize: this
        };
        if (!options.modelName) {
          options.modelName = m.model.name;
        }
        m.model.init(
          m.attributes,
          options
        );
      } else if (m.options?.modelName) {
        this.define(m.options.modelName, m.attributes, m.options);
      }
    });
  }

  /**
   * Retrieves the Sequelize connection instance.
   *
   * @returns The Sequelize instance (this manager itself)
   *
   * @example
   * ```typescript
   * const sequelize = manager.getConnection();
   * const [results] = await sequelize.query('SELECT NOW()');
   * ```
   */
  getConnection(): Sequelize {
    return this;
  }

  /**
   * Closes the Sequelize connection.
   * Terminates all active connections in the pool.
   *
   * @returns A promise that resolves when the connection is closed
   *
   * @example
   * ```typescript
   * await manager.closeConnection();
   * ```
   */
  async closeConnection(): Promise<void> {
    await this.close();
  }

  /**
   * Fetches a model that has already been defined in this Sequelize instance.
   *
   * @template M - The ModelStatic type, defaults to ModelStatic<Model>
   *
   * @param name - The name of the model to retrieve
   *
   * @returns The requested model class
   *
   * @example
   * ```typescript
   * const User = manager.getModel('User');
   * const user = await User.findOne({ where: { email: 'user@example.com' } });
   * ```
   */
  getModel<M extends ModelStatic<Model> = ModelStatic<Model>>(name: string): M;
  /**
   * Fetches a model that has already been defined in this Sequelize instance.
   *
   * @template M - The Model type, defaults to Model
   *
   * @param name - The name of the model to retrieve
   *
   * @returns The requested model class
   */
  getModel<M extends Model = Model>(name: string): ModelStatic<M>;
  /**
   * Fetches a model that has already been defined in this Sequelize instance.
   *
   * @template TModelAttributes - The model attributes type
   * @template TCreationAttributes - The creation attributes type
   *
   * @param name - The name of the model to retrieve
   *
   * @returns The requested model class
   */
  getModel<TModelAttributes extends Record<string, unknown> = AnyJsonObject, TCreationAttributes extends Record<string, unknown> = AnyJsonObject>(name: string): ModelStatic<Model<TModelAttributes, TCreationAttributes>>;
  getModel<M extends ModelStatic<Model> = ModelStatic<Model>>(name: string): M {
    return <M>(this.model(name));
  }

  /**
   * Checks if the Sequelize connection is active and can authenticate with the database.
   *
   * @returns A promise that resolves to true if authentication succeeds, false otherwise
   *
   * @remarks
   * This method tests the connection by running the authenticate() method,
   * which verifies that the database credentials are correct and the database is accessible.
   * For a more comprehensive check with additional metrics, use {@link healthCheck}.
   *
   * @example
   * ```typescript
   * if (await manager.isConnected()) {
   *   console.log('Sequelize connection is active');
   * } else {
   *   console.log('Cannot connect to database');
   * }
   * ```
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Performs a comprehensive health check on the Sequelize connection.
   * Tests connectivity by authenticating with the database and gathering connection information.
   *
   * @returns A promise that resolves to a detailed health check result including:
   * - Connection status
   * - Database dialect and version
   * - Registered models
   * - Authentication latency
   * - Error details (if unhealthy)
   *
   * @example
   * ```typescript
   * const health = await manager.healthCheck();
   * if (health.healthy) {
   *   console.log(`Sequelize is healthy. Latency: ${health.details.latency}`);
   *   console.log(`Database: ${health.details.dialect} v${health.details.databaseVersion}`);
   *   console.log(`Models: ${health.details.models?.join(', ')}`);
   * } else {
   *   console.error(`Sequelize is unhealthy: ${health.message}`);
   * }
   * ```
   */
  async healthCheck(): Promise<SequelizeHealthCkeckResult> {
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