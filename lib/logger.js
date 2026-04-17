const isProd = process.env.NODE_ENV === "production";

function fmt(level, msg, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta || {}),
  };
  return JSON.stringify(entry);
}

export const logger = {
  info(msg, meta) {
    console.log(fmt("info", msg, meta));
  },
  warn(msg, meta) {
    console.warn(fmt("warn", msg, meta));
  },
  // In prod: log only message + path, never full stack to client.
  error(msg, err, meta) {
    const payload = { ...(meta || {}) };
    if (err) {
      payload.err = isProd ? err.message : err.stack || err.message;
      if (err.code) payload.code = err.code;
    }
    console.error(fmt("error", msg, payload));
  },
};
