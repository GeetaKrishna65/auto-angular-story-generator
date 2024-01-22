import { consola } from "consola";
import { loadFile } from "magicast";
import { minimatch } from "minimatch";
import { Project } from "ts-morph";
import { createUnplugin } from "unplugin";

import { genLitStoryFile } from "~/src/presets/lit/genLitStoryFile";
import { genStoryFile } from "~/src/utils/genStoryFile";

export type AsgOptions = {
  preset: "lit" | "react" | "vue" | "custom";
  /**
   * @default undefined
   *
   * @description
   *
   * The directories to watch for changes.
   *
   * @example
   *
   * `**\/src/components/*.ts`
   * `**\/src/components/**\/*.ts`
   */
  imports?: string[];
};

const unplugin = createUnplugin((options: AsgOptions) => {
  return {
    name: "auto-story-generator",
    async watchChange(file, change) {
      if (file.includes(".stories")) return;

      const isMatches = options.imports
        ? options.imports.map((importDir) => {
            return minimatch(file, importDir);
          })
        : [true];

      if (!isMatches.includes(true)) {
        return consola.error("Not a target file for automatic generation");
      }

      const projectRootDir = process.cwd();
      const fileName = file.split("/").pop();
      const fileType = fileName?.split(".").slice(1).join(".");
      const componentName = fileName?.replace(`.${fileType}`, "");
      const relativeSourceFilePath = file.replace(projectRootDir, "");

      if (!componentName) {
        return consola.error("Could not find component name");
      }

      // consola.info(`${componentName} component has been changed`);

      const mod = await loadFile(file);
      const project = new Project();
      const sourceFile = project.createSourceFile(fileName || "", mod.$code);

      consola.start(`${componentName} Story file is being generated ....`);

      switch (options.preset) {
        case "lit": {
          await genLitStoryFile({
            componentName,
            fileName: fileName || "",
            path: file,
            type: `.${fileType}`,
            relativeSourceFilePath,
            sourceFile,
          });

          break;
        }

        case "react": {
          await genStoryFile({
            fileOptions: {
              componentName,
              fileName: fileName || "",
              path: file,
              type: `.${fileType}`,
              relativeSourceFilePath,
              sourceFile,
            },
            generateOptions: {
              fileType: `.stories.${fileType}`,
              initialCode:
                "const meta = {render: () => {}, args: {}, argTypes: {}};",
              meta: {
                render: "() => {}",
                args: {},
                argTypes: {},
              },
            },
          });

          break;
        }

        case "vue": {
          consola.error("Not yet supported.");
          break;
        }

        case "custom": {
          consola.error("Not yet supported.");
          break;
        }

        default: {
          consola.error(
            `Preset ${options.preset} is not supported. Please use one of the following: lit, react, vue, custom`,
          );
        }
      }
    },
  };
});

export default unplugin;
