import { IManager, ManagerArg } from '@storehouse/core/lib/manager';
import { Registry } from '@storehouse/core/lib/registry';
import {
  Sequelize,
  Model, 
  ModelAttributes, 
  ModelOptions,
  Options,
  ModelCtor
} from 'sequelize';
import Logger from '@novice1/logger';

const Log = Logger.debugger('@storehouse/sequelize');
const AnyJson = {}

export type ModelInit<TModelAttributes extends typeof AnyJson = typeof AnyJson, TCreationAttributes extends typeof AnyJson = TModelAttributes> = { 
  new(): Model<TModelAttributes, TCreationAttributes>;
  init: typeof Model['init'];
};

export interface ModelSettings<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TModelAttributes extends typeof AnyJson = any, 
  TCreationAttributes extends typeof AnyJson = TModelAttributes> {
  attributes: ModelAttributes<Model<TModelAttributes, TCreationAttributes>, TModelAttributes>;
  model?: ModelInit<TModelAttributes, TCreationAttributes>;
  options?: ModelOptions<Model<TModelAttributes, TCreationAttributes>>;
}

export interface SequelizeManagerSettings {
  options?: Options;
  models?: ModelSettings[]
}

export interface SequelizeManagerArg extends ManagerArg {
  config?: SequelizeManagerSettings;
}

/**
 * 
 * @param registry 
 * @param manager Manager name or model name
 * @param modelName Model name
 * @returns 
 */
function getMdl<M extends Model = Model>(registry: Registry, managerName: string, modelName?: string): ModelCtor<M>;
function getMdl<M extends ModelCtor<Model> = ModelCtor<Model>>(registry: Registry, managerName: string, modelName?: string): M;
function getMdl<TModelAttributes extends Record<string, unknown> = typeof AnyJson, TCreationAttributes extends Record<string, unknown> = typeof AnyJson>(registry: Registry, managerName: string, modelName?: string): ModelCtor<Model<TModelAttributes, TCreationAttributes>>;
function getMdl<M extends Model = Model>(registry: Registry, managerName: string, modelName?: string): ModelCtor<M> {
  const model = registry.getModel<ModelCtor<M>>(managerName, modelName);
  if (!model) {
    throw new ReferenceError(`Could not find model "${modelName || managerName}"`);
  }
  return model;
}

export const getModel = getMdl;

export function getManager<M extends SequelizeManager = SequelizeManager>(registry: Registry, managerName?: string): M {
  const manager = registry.getManager<M>(managerName);
  if (!manager) {
    throw new ReferenceError(`Could not find manager "${managerName || registry.defaultManager}"`);
  }
  if (!(manager instanceof SequelizeManager)) {
    throw new TypeError(`Manager "${managerName || registry.defaultManager}" is not instance of SequelizeManager`);
  }
  return manager;
}

export function getConnection(registry: Registry, managerName?: string): Sequelize {
  const conn = registry.getConnection<Sequelize>(managerName);
  if (!conn) {
    throw new ReferenceError(`Could not find connection "${managerName || registry.defaultManager}"`);
  }
  return conn;
}

export class SequelizeManager extends Sequelize implements IManager {
  static readonly type = '@storehouse/sequelize';

  protected name: string;

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
      } else if (m.options?.modelName){
        this.define(m.options.modelName, m.attributes, m.options);
      }
    });
  }

  getConnection(): Sequelize {
    return this;
  }

  async closeConnection(): Promise<void> {
    await this.close();
  }

  /**
   * Fetch a Model which is already defined
   */
  getModel<M extends ModelCtor<Model> = ModelCtor<Model>>(name: string): M;
  getModel<M extends Model = Model>(name: string): ModelCtor<M>;
  getModel<TModelAttributes extends Record<string, unknown> = typeof AnyJson, TCreationAttributes extends Record<string, unknown> = typeof AnyJson>(name: string): ModelCtor<Model<TModelAttributes, TCreationAttributes>>;
  getModel<M extends ModelCtor<Model> = ModelCtor<Model>>(name: string): M {
    return <M>(this.model(name));
  }
}