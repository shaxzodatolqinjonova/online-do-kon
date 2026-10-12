// Ishlatish:  npm run admin:setup -- "sizning-parolingiz"
// .env fayliga admin parol xeshi va sessiya kalitini yozadi.
import { scryptSync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const password = process.argv[2] ?? process.env.ADMIN_PASSWORD; // serverda parol buyruq satriga yozilmasligi uchun muhit oʻzgaruvchisi ham qabul qilinadi
if (!password || password.length < 8) {
  console.error('Parol kamida 8 belgi boʻlsin. Misol: npm run admin:setup -- "meningParolim2026"');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = `s1.${salt.toString("hex")}.${scryptSync(password, salt, 64).toString("hex")}`;
const secret = randomBytes(32).toString("hex");

let env = existsSync(".env") ? readFileSync(".env", "utf8") : "";
const set = (key, value) => {
  const line = `${key}="${value}"`;
  env = new RegExp(`^${key}=.*$`, "m").test(env) ? env.replace(new RegExp(`^${key}=.*$`, "m"), line) : env.replace(/\n*$/, "\n") + line + "\n";
};
set("ADMIN_PASSWORD_HASH", hash);
if (!/^SESSION_SECRET=".{32,}"/m.test(env)) set("SESSION_SECRET", secret);
writeFileSync(".env", env);

console.log(".env yangilandi.\n");
console.log("Serverga (Vercel) joylash uchun shu ikki qatorni Environment Variables boʻlimiga kiriting:");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`SESSION_SECRET=${/^SESSION_SECRET="(.+)"/m.exec(env)[1]}`);
