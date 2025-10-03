import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const TOOL_CANDIDATES = [
  {
    command: 'magick',
    description: 'ImageMagick',
    buildArgs: (input, output) => [input, output]
  },
  {
    command: 'convert',
    description: 'ImageMagick',
    buildArgs: (input, output) => [input, output]
  },
  {
    command: 'heif-convert',
    description: 'libheif',
    buildArgs: (input, output) => [input, output]
  }
];

async function isCommandAvailable(command) {
  try {
    await execFileAsync('which', [command]);
    return true;
  } catch (error) {
    return false;
  }
}

export async function detectConverter(preferredCommand = process.env.HEIC_CONVERTER) {
  if (preferredCommand) {
    const candidate = TOOL_CANDIDATES.find((tool) => tool.command === preferredCommand);
    if (!candidate) {
      throw new Error(`Unsupported converter command provided: ${preferredCommand}`);
    }

    if (!(await isCommandAvailable(candidate.command))) {
      throw new Error(
        `Preferred converter "${preferredCommand}" is not available on this system. Install it or remove HEIC_CONVERTER.`
      );
    }

    return candidate;
  }

  for (const tool of TOOL_CANDIDATES) {
    if (await isCommandAvailable(tool.command)) {
      return tool;
    }
  }

  throw new Error(
    'No HEIC conversion tool found. Please install ImageMagick (`magick`/`convert`) or `heif-convert` and try again.'
  );
}

export async function runConverter({ command, buildArgs }, inputPath, outputPath) {
  const args = buildArgs(inputPath, outputPath);
  await execFileAsync(command, args);
  return outputPath;
}
