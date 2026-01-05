module.exports = {
  title: 'NEXUS V1 Docs',
  tagline: 'Documentación centralizada para el monorepo NEXUS V1',
  url: 'https://your-org.github.io',
  baseUrl: '/NEXUS V1/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'noepab',
  projectName: 'NEXUS V1',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/noepab/NEXUS V1/edit/main/docs/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};

