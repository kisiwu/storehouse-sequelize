module.exports = {
  enableLogs: true,
  exitOnFail: true,
  files: 'test/src',
  ext: '.test.ts',
  options: {
    bail: false,
    fullTrace: true,
    grep: '',
    ignoreLeaks: false,
    reporter: 'spec',
    retries: 0,
    slow: 10000,
    timeout: 30000,
    ui: 'bdd',
    color: true,
  },
  parameters: {
    db: {
      dialect: process.env.TEST_DB_DIALECT || 'mysql',
      host: process.env.TEST_DB_HOSTNAME || 'localhost',
      port: process.env.TEST_DB_PORT,
      database: process.env.TEST_DB_NAME || 'ci',
      username: process.env.TEST_DB_USERNAME || 'root',
      password: process.env.TEST_DB_PASSWORD || ''
    }
  },
};
