module.exports = {
  apps: [
    {
      name: 'shop-client',
      script: 'serve',
      args: '-s client/dist -l 3000',
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'shop-server',
      script: 'dist/src/index.js',
      cwd: 'server',
      watch: false,
      interpreter: 'bun',
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
      },
    },
    {
      name: 'low-stock-checker',
      script: 'src/scripts/low-stock-checker.ts',
      cwd: 'server',
      watch: false,
      interpreter: 'bun',
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
