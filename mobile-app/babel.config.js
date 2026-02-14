const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "react" }],
    ],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "convex/_generated/api": path.resolve(__dirname, "../backend/convex/_generated/api"),
            "convex/_generated/dataModel": path.resolve(__dirname, "../backend/convex/_generated/dataModel"),
          },
        },
      ],
    ],
  };
};
