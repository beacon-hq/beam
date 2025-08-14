import defineVersionedConfig from "vitepress-versioning-plugin";

const BASE_PATH = '/'

// https://vitepress.dev/reference/site-config
export default defineVersionedConfig({
  title: "Beam",
  description: "A client-side library for Beacon & Laravel Pennant",
  base: BASE_PATH,
  versioning: {
    latestVersion: 'dev',
  },
  head: [
      ['meta', { name: 'author', content: 'Beacon HQ' }],
      ['meta', { name: 'og:type', content: 'website' }],
      ['meta', { name: 'og:title', content: 'Beam — Laravel Pennant in your Browser' }],
      [
          'meta',
          {
              name: 'og:description',
              content:
                  'Access Laravel Pennant feature flags in your browser with Beam, a client-side library for Beacon and Laravel Pennant.',
          },
      ],
      ['meta', { name: 'og:image', content: '/images/social.png' }],

      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: 'Beam — Laravel Pennant in your Browser' }],
      [
          'meta',
          {
              name: 'twitter:description',
              content:
                  'Access Laravel Pennant feature flags in your browser with Beam, a client-side library for Beacon and Laravel Pennant.',
          },
      ],
      ['meta', { name: 'twitter:image', content: '/images/social.png' }],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
    ],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
    ],
    [
      'link',
      { href: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap', rel: 'stylesheet' }
    ],
  ],
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          "root": {
             translations: {
               button: {
                 buttonText: "Search latest version…"
               }
             }
          }
        },
        async _render(src, env, md) {
          const html = md.render(src, env)
          if (env.frontmatter?.search === false) return ''
          if (env.relativePath.match(/\d+\.(\d+|x)/) !== null) return ''
          return html
        }
      },
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: './guide/getting-started' },
      {
        component: 'VersionSwitcher',
      }
    ],

    sidebar: {
      "/": [
        {
          text: 'Basics',
          items: [
            {
              text: 'Get Started',
              link: '/guide/getting-started'
            },
            {
              text: 'Configuration',
              link: '/guide/configuration'
            },
          ]
        },
        {
          text: 'Frameworks',
          items: [
            { text: 'React', link: '/frameworks/react' },
            { text: 'Vue', link: '/frameworks/vue' },
          ],
        },
        {
          text: 'API',
          items: [
            { text: 'Core', link: '/api/core' },
            { text: 'React', link: '/api/react' },
            { text: 'Vue', link: '/api/vue' },
          ],
        },
      ]
    },

    footer: {
      message: "Made with 🦁💖🏳️‍🌈 by <a href=\"https://www.daveyshafik.com\">Davey Shafik</a>.",
      copyright: "Released under the MIT License. Copyright © 2025 Davey Shafik.",
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/beacon-hq/beam' }
    ],

    versionSwitcher: false,
  },
  markdown: {
    theme: {
      dark: 'monokai',
      light: 'github-light'
    },
  },
}, __dirname)
