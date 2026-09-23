import { access, chmod, copyFile, mkdir, rename, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const nativeFailurePattern = /ERR_DLOPEN_FAILED|code signature|Team IDs|@rollup\/rollup-/i;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function probe(nodeRuntime, viteBin, cwd) {
  const result = spawnSync(nodeRuntime, [viteBin, '--version'], {
    cwd,
    env: process.env,
    encoding: 'utf8',
    timeout: 5000,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  return {
    ok: result.status === 0,
    nativeFailure: nativeFailurePattern.test(output),
    output,
  };
}

function compactError(output) {
  const lines = output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return lines.slice(-3).join(' ').slice(0, 800);
}

async function createSignedRuntime({ source, target, cwd, viteBin }) {
  await mkdir(dirname(target), { recursive: true });
  const temp = `${target}.${process.pid}.tmp`;
  await copyFile(source, temp);
  await chmod(temp, 0o755);
  const signed = spawnSync('/usr/bin/codesign', ['--force', '--sign', '-', temp], {
    cwd,
    encoding: 'utf8',
    timeout: 10000,
  });
  if (signed.status !== 0) {
    await rm(temp, { force: true });
    throw new Error(`无法为本地构建运行时签名：${compactError(`${signed.stdout ?? ''}\n${signed.stderr ?? ''}`)}`);
  }
  try {
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { force: true });
    if (error.code !== 'EEXIST') throw error;
  }
  const checked = probe(target, viteBin, cwd);
  if (!checked.ok) throw new Error(`兼容运行时创建成功，但 Vite 仍无法启动：${compactError(checked.output)}`);
  return target;
}

export async function resolveBuildRuntime({ projectRoot, nodeModules, viteBin, runtimeCacheRoot }) {
  const cacheRoot = runtimeCacheRoot ?? resolve(projectRoot, '.build-runtime');
  const runtimeTarget = resolve(cacheRoot, `node-${process.version}-${process.arch}`);
  if (await exists(runtimeTarget)) {
    const cached = probe(runtimeTarget, viteBin, projectRoot);
    if (cached.ok) return runtimeTarget;
  }

  const current = probe(process.execPath, viteBin, projectRoot);
  if (current.ok) return process.execPath;

  if (process.platform !== 'darwin' || !current.nativeFailure) {
    throw new Error(`Vite 工具链预检失败：${compactError(current.output)}`);
  }

  const sourceStat = await stat(process.execPath);
  if (sourceStat.size === 0) throw new Error('当前 Node 运行时文件为空，无法准备构建运行时。');
  return createSignedRuntime({ source: process.execPath, target: runtimeTarget, cwd: projectRoot, viteBin });
}
