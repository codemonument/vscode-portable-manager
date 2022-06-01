import { join } from "../deps/_path.std.ts";
import { chooseValidVSCodeInstall } from "../features/choose-valid-vscode-install.ts";
import { cleanFolder } from "../features/clean-folder.ts";
import { cleanupUserTempDirs } from "../features/cleanup-user-temp-dirs.ts";
import { downloadVSCodeZip } from "../features/download-vscode-zip.ts";
import { decompress } from "../forks/zip@1.2.3/mod.ts";
import { startKia } from "../utils/start-kia.ts";
import { UpdateArgs } from "./updateArgs.type.ts";
import { log } from "../deps/_log.std.ts";

/**
 * Implements the update command for codeup cli
 */
export async function update({ safeExtract, installLocation }: UpdateArgs) {
  log.info("Updating vscode...");
  return;
  const workingVscodeDir = await chooseValidVSCodeInstall(
    { type: "CLI_ARG", location: installLocation },
    { type: "ENV_VSCODE_INSTALL", location: Deno.env.get("VSCODE_INSTALL") },
    { type: "CWD", location: Deno.cwd() },
  );

  const updateZipName = "vscode-update.zip";
  const updateZipPath = join(workingVscodeDir.location, updateZipName);

  await cleanupUserTempDirs(workingVscodeDir);
  await downloadVSCodeZip("archive", workingVscodeDir.location, updateZipName);
  await cleanFolder(".", {
    ignore: [
      "data",
      updateZipName,
      ".gitkeep",
      "portable-vscode-updater.exe",
      "wcvm.exe",
    ],
  });

  /**
   * Unzip update zip
   */
  const kiaUnzip = await startKia(`Unzip ${updateZipPath}`);
  const result = await decompress(updateZipPath, workingVscodeDir.location, {
    // default for safeExtract is false
    overwrite: !safeExtract,
  });
  if (result === false) throw new Error(`Zip Extraction failed!`);
  await kiaUnzip.succeed(`Unzipped ${updateZipPath}`);

  /**
   * Delete update zip
   */
  const kiaZipDelete = await startKia(`Remove ${updateZipPath}`);
  await Deno.remove(updateZipPath);
  await kiaZipDelete.succeed(`Removed ${updateZipPath}`);

  log.info("VSCode Update finished successfully!");
}

/**
 * Export yargs command module
 * See: https://github.com/yargs/yargs/blob/main/docs/advanced.md#providing-a-command-module
 */

export const updateYargsCommand = {
  command: ["update", "u"],
  handler: update,
  describe:
    `Updates a given portable vscode installation to the latest version`,
};
