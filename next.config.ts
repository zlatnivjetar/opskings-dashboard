import { spawnSync } from 'node:child_process';
import bundleAnalyzer from '@next/bundle-analyzer';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

function resolveBuildRevision() {
  const gitSha = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    encoding: 'utf-8',
  }).stdout.trim();

  return process.env.VERCEL_GIT_COMMIT_SHA ?? gitSha ?? Date.now().toString();
}

const buildRevision = resolveBuildRevision();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== 'production',
  additionalPrecacheEntries: [
    {
      revision: buildRevision,
      url: '/~offline',
    },
  ],
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: buildRevision,
  },
};

export default withBundleAnalyzer(withSerwist(nextConfig));
