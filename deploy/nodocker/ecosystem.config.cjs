module.exports = {
  apps: [
    {
      name: "mwangaza-api",
      script: "src/server.js",
      cwd: "/opt/mwangaza/current/api",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "300M",
      env_file: "/etc/mwangaza/api.env",
      env: {
        NODE_ENV: "production",
        PORT: "4000"
      }
    }
  ]
};
