const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const command = process.argv[2] || "dev";
const extraArgs = process.argv.slice(3);
const env = { ...process.env };

if (process.platform === "win32") {
  try {
    const ca = require("win-ca/api");
    const certificates = [];

    ca({
      fallback: true,
      format: ca.der2.pem,
      ondata: (certificate) => certificates.push(certificate),
    });

    const bundle = path.join(__dirname, "..", ".windows-ca-bundle.pem");
    fs.writeFileSync(bundle, `${certificates.join("\n")}\n`);
    env.NODE_EXTRA_CA_CERTS = bundle;
    env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log(
      `[pre-natal] ${certificates.length} certificados do Windows exportados para o Node.`,
    );
  } catch (error) {
    env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.warn(
      "[pre-natal] Não foi possível exportar os certificados do Windows:",
      error,
    );
  }
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, command, ...extraArgs], {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
