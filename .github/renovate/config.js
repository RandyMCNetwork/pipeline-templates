const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const disabledPackages = (process.env.RENOVATE_DISABLED_PACKAGES ?? '')
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter(Boolean);

const paperApiVersion = '26.2.build.129-stable';

const packageRules = [
  {
    matchPackageNames: ['/^de\\.randymc:/', '/^xyz\\.daarkii:/'],
    minimumReleaseAge: null,
  },
  {
    matchUpdateTypes: ['major', 'minor', 'patch', 'pin', 'digest'],
    automerge: true,
    automergeType: 'pr',
    platformAutomerge: true,
  },
  {
    matchPackageNames: ['io.papermc.paper:paper-api'],
    allowedVersions: `/^${escapeRegExp(paperApiVersion)}$/`,
  },
];

if (disabledPackages.length > 0) {
  packageRules.push({
    matchPackageNames: disabledPackages,
    enabled: false,
  });
}

module.exports = {
  onboarding: false,
  requireConfig: 'optional',
  extends: ['config:recommended'],
  baseBranchPatterns: ['dev', '$default'],
  dependencyDashboard: true,
  labels: ['dependencies'],
  minimumReleaseAge: '7 days',
  rangeStrategy: 'bump',
  packageRules,
};
