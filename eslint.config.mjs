import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"), // 继承 next/core-web-vitals 的所有配置
  // 在这里添加一个新的配置对象来覆盖或修改规则
  {
    rules: {
      // 修改 react/no-unescaped-entities 规则
      "react/no-unescaped-entities": [
        "error", // 或者 "warn"，取决于你希望它是错误还是警告
        {
          "forbid": [
            ">", // 仍然禁止 >
            "}"  // 仍然禁止 }
            // 注意：这里移除了 "\""，所以它不会再被警告
            // 如果你还需要禁止例如 '<'，你可以添加 "<"
          ]
        }
      ],
    },
  },
];

export default eslintConfig;
