import chalk from "chalk";

export const log = {
  header: (s: string) => console.log(chalk.yellow(`\n🔥 ${s}`)),
  v3: (s: string) => console.log(chalk.blue(`\n🦄 ${s}`)),
  ur: (s: string) => console.log(chalk.magenta(`\n🧩 ${s}`)),
  green: (s: string) => console.log(chalk.green(s)),
  cyan: (s: string) => console.log(chalk.cyan(s)),
  warn: (s: string) => console.log(chalk.red(`⚠️ ${s}`)),
  dim: (s: string) => console.log(chalk.gray(s)),
};
