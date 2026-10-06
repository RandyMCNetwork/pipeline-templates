const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const disabledPackages = (process.env.RENOVATE_DISABLED_PACKAGES ?? '')
  .split(/\r?\n/)
  .map((name) => name.trim())
  .filter(Boolean);

const targetBranch = process.env.RENOVATE_TARGET_BRANCH || '$default';

const paperApiVersion = '26.2.build.129-stable';
const cloudNetVersion = '4.0.0-RC16';
const velocityApiMajor = '4';

const packageRules = [
  {
    matchPackageNames: ['*'],
    allowedVersions: '!/-SNAPSHOT$/i',
  },
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
  {
    matchPackageNames: ['/^eu\\.cloudnetservice\\.cloudnet:/'],
    allowedVersions: `/^${escapeRegExp(cloudNetVersion)}$/i`,
  },
  {
    matchPackageNames: ['/^xyz\\.daarkii:/'],
    groupName: 'daarkii libraries',
  },
  {
    matchPackageNames: ['/^de\\.randymc:/', 'de.randymc.paper-libraries'],
    groupName: 'randymc packages',
  },
  {
    matchPackageNames: ['/^org\\.apache\\.maven\\.resolver:/'],
    allowedVersions: '<2',
  },
  {
    // 0.12.1 throws when constructing any Gui (stefvanschie/IF#2548); 0.12.2 carries the fix.
    matchPackageNames: ['com.github.stefvanschie.inventoryframework:IF'],
    allowedVersions: '!/^0\\.12\\.1$/',
  },
  {
    matchPackageNames: ['typescript'],
    allowedVersions: '<7',
  },
  {
    matchPackageNames: ['com.velocitypowered:velocity-api'],
    allowedVersions: `/^${velocityApiMajor}\\.(?!.*-SNAPSHOT$)/i`,
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
  baseBranchPatterns: [targetBranch],
  dependencyDashboard: true,
  labels: ['dependencies'],
  minimumReleaseAge: '7 days',
  prHourlyLimit: 10,
  rangeStrategy: 'bump',
  hostRules: process.env.RENOVATE_REPOSILITE_USER
    ? [{
        matchHost: 'repo.milu.me',
        username: process.env.RENOVATE_REPOSILITE_USER,
        password: process.env.RENOVATE_REPOSILITE_TOKEN,
      }]
    : [],
  packageRules,
};
